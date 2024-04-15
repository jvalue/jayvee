// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import {
  type TransformBody,
  type TransformPortDefinition,
  isTransformPortDefinition,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';
import { checkUniqueNames } from '../validation-util';

import {
  extractReferenceLiterals,
  validateTransformOutputAssignment,
} from './transform-output-assigment';

export function validateTransformBody(
  transformBody: TransformBody,
  props: JayveeValidationProps,
): void {
  checkUniqueNames(
    transformBody.ports,
    props.validationContext,
    'transform port',
  );
  checkUniqueOutputAssignments(transformBody, props);

  checkSingleOutputPort(transformBody, props);

  checkAreInputsUsed(transformBody, props);

  for (const property of transformBody.outputAssignments) {
    validateTransformOutputAssignment(property, props);
  }
}

function checkUniqueOutputAssignments(
  transformBody: TransformBody,
  props: JayveeValidationProps,
): void {
  const assignedOutputPorts = transformBody?.outputAssignments ?? [];
  const definedOutputPorts =
    transformBody?.ports?.filter((x) => x?.kind === 'to') ?? [];

  for (const definedOutputPort of definedOutputPorts) {
    const usedInAssignments = assignedOutputPorts.filter(
      (x) => x?.outPortName?.ref?.name === definedOutputPort.name,
    );

    if (usedInAssignments.length === 0) {
      props.validationContext.accept(
        'error',
        'An output assignment is required for this port',
        { node: definedOutputPort, property: 'name' },
      );
    }

    if (usedInAssignments.length > 1) {
      usedInAssignments.forEach((usedAssignment) => {
        props.validationContext.accept(
          'error',
          'At most one assignment per output port',
          {
            node: usedAssignment,
            property: 'outPortName',
          },
        );
      });
    }
  }
}

function checkSingleOutputPort(
  transformBody: TransformBody,
  props: JayveeValidationProps,
): void {
  const ports = transformBody.ports?.filter((x) => x.kind === 'to');
  if (ports === undefined) {
    return undefined;
  }

  if (ports.length > 1) {
    ports.forEach((port) => {
      props.validationContext.accept(
        'error',
        `More than one output port is defined`,
        {
          node: port,
        },
      );
    });
  }

  if (ports.length === 0) {
    props.validationContext.accept(
      'error',
      `There has to be a single output port`,
      {
        node: transformBody.$container,
        property: 'name',
      },
    );
  }
}

function checkAreInputsUsed(
  transformBody: TransformBody,
  props: JayveeValidationProps,
): void {
  const inputs = transformBody.ports?.filter((x) => x.kind === 'from');
  const outputAssignments = transformBody?.outputAssignments;
  if (inputs === undefined || outputAssignments === undefined) {
    return undefined;
  }

  const referencedPorts: TransformPortDefinition[] = [];
  outputAssignments.forEach((outputAssignment) => {
    const referenceLiterals = extractReferenceLiterals(
      outputAssignment?.expression,
    );

    referencedPorts.push(
      ...referenceLiterals
        .map((x) => x?.value?.ref)
        .filter(isTransformPortDefinition),
    );
  });

  const referencedPortNames = referencedPorts.map((x) => x?.name);
  inputs.forEach((input) => {
    if (input.name === undefined) {
      return;
    }

    if (!referencedPortNames.includes(input.name)) {
      if (isOutputPortComplete(input)) {
        props.validationContext.accept(
          'warning',
          'This input port is never used',
          {
            node: input,
          },
        );
      }
    }
  });
}

function isOutputPortComplete(
  portDefinition: TransformPortDefinition,
): boolean {
  const valueType = portDefinition?.valueType?.reference?.ref;
  if (valueType === undefined) {
    return false;
  }

  return valueType?.name !== undefined;
}
