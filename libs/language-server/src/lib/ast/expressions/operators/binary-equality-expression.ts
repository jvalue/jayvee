// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { BinaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { PropertyValuetype, isNumericType } from '../../model-util';
import { BinaryTypeInferenceFunction } from '../operator-registry';

export const inferBinaryEqualityExpressionType: BinaryTypeInferenceFunction = (
  leftType: PropertyValuetype,
  rightType: PropertyValuetype,
  expression: BinaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined => {
  assert(expression.operator === '==' || expression.operator === '!=');

  if (leftType !== rightType) {
    if (isNumericType(leftType) && isNumericType(rightType)) {
      context?.accept(
        'warning',
        `The operands are of different numeric types (left: ${leftType}, right: ${rightType})`,
        {
          node: expression,
        },
      );
    } else {
      context?.accept(
        'error',
        `The types of the operands need to be equal but they differ (left: ${leftType}, right: ${rightType})`,
        { node: expression },
      );
      return undefined;
    }
  }

  return PropertyValuetype.BOOLEAN;
};
