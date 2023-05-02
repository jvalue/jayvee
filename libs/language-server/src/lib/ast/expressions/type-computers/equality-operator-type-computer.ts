// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { BinaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { PropertyValuetype } from '../../model-util';
import {
  BinaryOperatorTypeComputer,
  convertsImplicitlyTo,
} from '../operator-type-computer';

export class EqualityOperatorTypeComputer
  implements BinaryOperatorTypeComputer
{
  computeType(
    leftOperandType: PropertyValuetype,
    rightOperandType: PropertyValuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined {
    assert(expression.operator === '==');

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
