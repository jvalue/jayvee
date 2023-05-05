// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { assertUnreachable } from 'langium';

import {
  TransformerBody,
  TransformerPortDefinition,
  VariableLiteral,
  isPrimitiveValuetypeKeywordLiteral,
  isValuetypeDefinitionReference,
} from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

// eslint-disable-next-line import/no-cycle
import {
  getReferencedVariables,
  validateTransformerOutputAssignment,
} from './transformer-output-assigment';

export function validateTransformerBody(
  transformerBody: TransformerBody,
  context: ValidationContext,
): void {
  checkUniqueNames(transformerBody.ports, context, 'transformer port');
  checkUniqueOutputAssignments(transformerBody, context);

  checkSingleInput(transformerBody, context);
  checkSingleOutput(transformerBody, context);

  checkAreInputsUsed(transformerBody, context);

  for (const property of transformerBody.outputAssignments) {
    validateTransformerOutputAssignment(property, context);
  }
}

function checkUniqueOutputAssignments(
  transformerBody: TransformerBody,
  context: ValidationContext,
): void {
  const assignedOutputPorts = transformerBody.outputAssignments;
  const definedOutputPorts = transformerBody.ports.filter(
    (x) => x.kind === 'to',
  );

  for (const definedOutputPort of definedOutputPorts) {
    const usedInAssignments = assignedOutputPorts.filter(
      (x) => x.outPortName?.ref?.name === definedOutputPort.name,
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

function checkSingleInput(
  transformerBody: TransformerBody,
  context: ValidationContext,
): void {
  const inputs = transformerBody.ports?.filter((x) => x.kind === 'from');
  if (inputs === undefined) {
    return undefined;
  }

  if (inputs.length > 1) {
    inputs.forEach((input) => {
      context.accept('error', 'More than one input port is defined', {
        node: input,
        property: 'kind',
      });
    });
  }
}

function checkSingleOutput(
  transformerBody: TransformerBody,
  context: ValidationContext,
): void {
  const outputs = transformerBody.ports?.filter((x) => x.kind === 'to');
  if (outputs === undefined) {
    return undefined;
  }

  if (outputs.length > 1) {
    outputs.forEach((input) => {
      context.accept('error', 'More than one outport port is defined', {
        node: input,
        property: 'kind',
      });
    });
  }
}

function checkAreInputsUsed(
  transformerBody: TransformerBody,
  context: ValidationContext,
): void {
  const inputs = transformerBody.ports?.filter((x) => x.kind === 'from');
  const outputAssignments = transformerBody?.outputAssignments;
  if (inputs === undefined || outputAssignments === undefined) {
    return undefined;
  }

  const referencedVariables: VariableLiteral[] = [];
  outputAssignments.forEach((outputAssignment) => {
    referencedVariables.push(
      ...getReferencedVariables(outputAssignment?.expression),
    );
  });

  const referecedVariableNames = referencedVariables.map(
    (x) => x.value?.ref?.name,
  );
  inputs.forEach((input) => {
    if (input.name === undefined) {
      return;
    }

    if (!referecedVariableNames.includes(input.name)) {
      if (isOutputPortComplete(input)) {
        context.accept('warning', 'This input port is never used', {
          node: input,
        });
      }
    }
  });
}

function isOutputPortComplete(
  portDefinition: TransformerPortDefinition,
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
