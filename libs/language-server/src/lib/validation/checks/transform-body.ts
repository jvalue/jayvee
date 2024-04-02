// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { EvaluationContext } from '../../ast/expressions/evaluation-context';
import {
  TransformBody,
  TransformPortDefinition,
  isTransformPortDefinition,
} from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

import {
  extractReferenceLiterals,
  validateTransformOutputAssignment,
} from './transform-output-assigment';

export function validateTransformBody(
  transformBody: TransformBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  checkUniqueNames(transformBody.ports, validationContext, 'transform port');
  checkUniqueOutputAssignments(transformBody, validationContext);

  checkSingleOutputPort(transformBody, validationContext);

  checkAreInputsUsed(transformBody, validationContext);

  for (const property of transformBody.outputAssignments) {
    validateTransformOutputAssignment(
      property,
      validationContext,
      evaluationContext,
    );
  }
}

function checkUniqueOutputAssignments(
  transformBody: TransformBody,
  context: ValidationContext,
): void {
  const assignedOutputPorts = transformBody?.outputAssignments ?? [];
  const definedOutputPorts =
    transformBody?.ports?.filter((x) => x?.kind === 'to') ?? [];

  for (const definedOutputPort of definedOutputPorts) {
    const usedInAssignments = assignedOutputPorts.filter(
      (x) => x?.outPortName?.ref?.name === definedOutputPort.name,
    );

    if (usedInAssignments.length === 0) {
      context.accept(
        'error',
        'An output assignment is required for this port',
        { node: definedOutputPort, property: 'name' },
      );
    }

    if (usedInAssignments.length > 1) {
      usedInAssignments.forEach((usedAssignment) => {
        context.accept('error', 'At most one assignment per output port', {
          node: usedAssignment,
          property: 'outPortName',
        });
      });
    }
  }
}

function checkSingleOutputPort(
  transformBody: TransformBody,
  context: ValidationContext,
): void {
  const ports = transformBody.ports?.filter((x) => x.kind === 'to');
  if (ports === undefined) {
    return undefined;
  }

  if (ports.length > 1) {
    ports.forEach((port) => {
      context.accept('error', `More than one output port is defined`, {
        node: port,
      });
    });
  }

  if (ports.length === 0) {
    context.accept('error', `There has to be a single output port`, {
      node: transformBody.$container,
      property: 'name',
    });
  }
}

function checkAreInputsUsed(
  transformBody: TransformBody,
  context: ValidationContext,
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
        context.accept('warning', 'This input port is never used', {
          node: input,
        });
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
