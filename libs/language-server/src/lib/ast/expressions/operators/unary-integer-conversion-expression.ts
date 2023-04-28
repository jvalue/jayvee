// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { UnaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { PropertyValuetype, isNumericType } from '../../model-util';
import { UnaryTypeInferenceFunction } from '../operator-registry';
import { generateUnexpectedTypeMessage } from '../type-inference';

export const inferUnaryIntegerConversionExpressionType: UnaryTypeInferenceFunction =
  (
    innerType: PropertyValuetype,
    expression: UnaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined => {
    assert(
      expression.operator === 'floor' ||
        expression.operator === 'ceil' ||
        expression.operator === 'round',
    );
    if (!isNumericType(innerType)) {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(PropertyValuetype.DECIMAL, innerType),
        {
          node: expression.expression,
        },
      );
      return undefined;
    }
    if (innerType === PropertyValuetype.INTEGER) {
      context?.accept(
        'warning',
        `The operator ${expression.operator} has no effect because the operand is already of type ${PropertyValuetype.INTEGER}`,
        {
          node: expression.expression,
        },
      );
    }
    return PropertyValuetype.INTEGER;
  };
