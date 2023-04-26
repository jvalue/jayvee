// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { BinaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import {
  PropertyValuetype,
  isNumericType,
  numericTypes,
} from '../../model-util';
import { BinaryTypeInferenceFunction } from '../operator-registry';
import { generateUnexpectedTypeMessage } from '../type-inference';

export const inferBinaryExponentialExpressionType: BinaryTypeInferenceFunction =
  (
    leftType: PropertyValuetype,
    rightType: PropertyValuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined => {
    assert(expression.operator === 'pow' || expression.operator === 'root');

    if (!isNumericType(leftType)) {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(numericTypes, leftType),
        {
          node: expression.left,
        },
      );
    }
    if (!isNumericType(rightType)) {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(numericTypes, rightType),
        {
          node: expression.right,
        },
      );
    }
    if (!isNumericType(leftType) || !isNumericType(rightType)) {
      return undefined;
    }
    return PropertyValuetype.DECIMAL;
  };
