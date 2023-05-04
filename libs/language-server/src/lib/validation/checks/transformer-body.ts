// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { TransformerBody } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

// eslint-disable-next-line import/no-cycle
import { validateTransformerOutputAssignment } from './transformer-output-assigment';

export function validateTransformerBody(
  transformerBody: TransformerBody,
  context: ValidationContext,
): void {
  checkUniqueNames(transformerBody.ports, context, 'transformer port');
  checkUniqueOutputAssignments(transformerBody, context);

  checkSingleInput(transformerBody, context);
  checkSingleOutput(transformerBody, context);

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
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const inputs = transformerBody.ports?.filter((x) => x.kind === 'from');
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const outputs = transformerBody.ports?.filter((x) => x.kind === 'to');
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
