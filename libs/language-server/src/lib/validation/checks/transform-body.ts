// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/working-with-the-ast for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { assertUnreachable } from 'langium';

import { EvaluationContext } from '../../ast/expressions/evaluation';
import {
  TransformBody,
  TransformPortDefinition,
  isPrimitiveValuetypeKeywordLiteral,
  isTransformPortDefinition,
  isValuetypeDefinitionReference,
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

  checkSinglePortOfKind(transformBody, 'from', validationContext);
  checkSinglePortOfKind(transformBody, 'to', validationContext);

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

function checkSinglePortOfKind(
  transformBody: TransformBody,
  portKind: TransformPortDefinition['kind'],
  context: ValidationContext,
): void {
  const portKindName = portKind === 'to' ? 'output' : 'input';

  const ports = transformBody.ports?.filter((x) => x.kind === portKind);
  if (ports === undefined) {
    return undefined;
  }

  if (ports.length > 1) {
    ports.forEach((port) => {
      context.accept('error', `More than one ${portKindName} port is defined`, {
        node: port,
      });
    });
  }

  if (ports.length === 0) {
    context.accept('error', `There has to be a single ${portKindName} port`, {
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
  const valueType = portDefinition?.valueType;
  if (valueType === undefined) {
    return false;
  }

  if (isPrimitiveValuetypeKeywordLiteral(valueType)) {
    return valueType?.keyword !== undefined;
  } else if (isValuetypeDefinitionReference(valueType)) {
    return valueType?.reference?.ref?.name !== undefined;
  }
  return assertUnreachable(valueType);
}
