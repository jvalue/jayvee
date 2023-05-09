// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationContext } from '../../../validation/validation-context';
import { BinaryExpression } from '../../generated/ast';
import { type Valuetype } from '../../wrappers/value-type';
// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetypes } from '../../wrappers/value-type/primitive/primitive-valuetypes';
import { BinaryOperatorTypeComputer } from '../operator-type-computer';

export class EqualityOperatorTypeComputer
  implements BinaryOperatorTypeComputer
{
  private readonly ALLOWED_OPERAND_TYPES = [
    PrimitiveValuetypes.Boolean,
    PrimitiveValuetypes.Text,
    PrimitiveValuetypes.Integer,
    PrimitiveValuetypes.Decimal,
  ];

  computeType(
    leftOperandType: Valuetype,
    rightOperandType: Valuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): Valuetype | undefined {
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
          `Operator does not support type ${leftOperandType.getName()}`,
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

    return PrimitiveValuetypes.Boolean;
  }
}
