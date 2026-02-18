// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValidationContext } from '../../../validation/validation-context';
import { type BinaryExpression } from '../../generated/ast';
import {
  type ValueType,
  type ValueTypeProvider,
} from '../../wrappers/value-type';
import { type BinaryOperatorTypeComputer } from '../operator-type-computer';

export class DotOperatorTypeComputer implements BinaryOperatorTypeComputer {
  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {}

  computeType(
    leftOperandType: ValueType,
    rightOperandType: ValueType,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): ValueType | undefined {
    if (!leftOperandType.equals(this.valueTypeProvider.Primitives.SheetRow)) {
      context?.accept(
        'error',
        `Operator does not support type ${leftOperandType.getName()}`,
        {
          node: expression.left,
        },
      );
      return undefined;
    }

    if (
      !rightOperandType.equals(this.valueTypeProvider.Primitives.Text) &&
      !rightOperandType.equals(this.valueTypeProvider.Primitives.Integer)
    ) {
      context?.accept(
        'error',
        `Operator does not support type ${rightOperandType.getName()}`,
        {
          node: expression.right,
        },
      );
      return undefined;
    }
    return this.valueTypeProvider.Primitives.Text;
  }
}
