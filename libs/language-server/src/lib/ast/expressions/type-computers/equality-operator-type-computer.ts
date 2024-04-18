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

export class EqualityOperatorTypeComputer
  implements BinaryOperatorTypeComputer
{
  private readonly ALLOWED_OPERAND_TYPES: ValueType[];

  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {
    this.ALLOWED_OPERAND_TYPES = [
      valueTypeProvider.Primitives.Boolean,
      valueTypeProvider.Primitives.Text,
      valueTypeProvider.Primitives.Integer,
      valueTypeProvider.Primitives.Decimal,
    ];
  }

  computeType(
    leftOperandType: ValueType,
    rightOperandType: ValueType,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): ValueType | undefined {
    const isLeftOperandTypeValid =
      this.ALLOWED_OPERAND_TYPES.includes(leftOperandType);
    const isRightOperandTypeValid =
      this.ALLOWED_OPERAND_TYPES.includes(rightOperandType);
    if (!isLeftOperandTypeValid || !isRightOperandTypeValid) {
      if (!isLeftOperandTypeValid) {
        context?.accept(
          'error',
          `Operator does not support type ${leftOperandType.getName()}`,
          {
            node: expression.left,
          },
        );
      }
      if (!isRightOperandTypeValid) {
        context?.accept(
          'error',
          `Operator does not support type ${rightOperandType.getName()}`,
          {
            node: expression.right,
          },
        );
      }
      return undefined;
    }

    if (
      !leftOperandType.isConvertibleTo(rightOperandType) &&
      !rightOperandType.isConvertibleTo(leftOperandType)
    ) {
      context?.accept(
        'error',
        `The types of the operands need to be equal but they differ (left: ${leftOperandType.getName()}, right: ${rightOperandType.getName()})`,
        { node: expression },
      );
      return undefined;
    }

    return this.valueTypeProvider.Primitives.Boolean;
  }
}
