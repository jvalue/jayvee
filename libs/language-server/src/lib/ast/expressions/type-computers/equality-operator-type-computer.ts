// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { BinaryExpression } from '../../generated/ast';
import { PropertyValuetype } from '../../model-util';
import {
  BinaryOperatorTypeComputer,
  convertsImplicitlyTo,
} from '../operator-type-computer';

export class EqualityOperatorTypeComputer
  implements BinaryOperatorTypeComputer
{
  private readonly ALLOWED_OPERAND_TYPES = [
    PropertyValuetype.BOOLEAN,
    PropertyValuetype.TEXT,
    PropertyValuetype.INTEGER,
    PropertyValuetype.DECIMAL,
  ];

  computeType(
    leftOperandType: PropertyValuetype,
    rightOperandType: PropertyValuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined {
    assert(expression.operator === '==');

    const isLeftOperandTypeValid =
      this.ALLOWED_OPERAND_TYPES.includes(leftOperandType);
    const isRightOperandTypeValid =
      this.ALLOWED_OPERAND_TYPES.includes(rightOperandType);
    if (!isLeftOperandTypeValid || !isRightOperandTypeValid) {
      if (!isLeftOperandTypeValid) {
        context?.accept(
          'error',
          `Operator does not support type ${leftOperandType}`,
          {
            node: expression.left,
          },
        );
      }
      if (!isRightOperandTypeValid) {
        context?.accept(
          'error',
          `Operator does not support type ${leftOperandType}`,
          {
            node: expression.right,
          },
        );
      }
      return undefined;
    }

    if (
      !convertsImplicitlyTo(leftOperandType, rightOperandType) &&
      !convertsImplicitlyTo(rightOperandType, leftOperandType)
    ) {
      context?.accept(
        'error',
        `The types of the operands need to be equal but they differ (left: ${leftOperandType}, right: ${rightOperandType})`,
        { node: expression },
      );
      return undefined;
    }

    return PropertyValuetype.BOOLEAN;
  }
}
