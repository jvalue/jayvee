// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { TransformerBody } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

export function validateTransformerBody(
  transformerBody: TransformerBody,
  context: ValidationContext,
): void {
  checkUniqueNames(transformerBody.ports, context, 'transformer port');
  checkUniqueOutputAssignments(transformerBody, context);
}

export function checkUniqueOutputAssignments(
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
