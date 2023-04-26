// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { UnaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import {
  PropertyValuetype,
  isNumericType,
  numericTypes,
} from '../../model-util';
import { UnaryTypeInferenceFunction } from '../operator-registry';
import { generateUnexpectedTypeMessage } from '../type-inference';

export const inferUnarySqrtExpressionType: UnaryTypeInferenceFunction = (
  innerType: PropertyValuetype,
  expression: UnaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined => {
  assert(expression.operator === 'sqrt');
  if (!isNumericType(innerType)) {
    context?.accept(
      'error',
      generateUnexpectedTypeMessage(numericTypes, innerType),
      {
        node: expression.expression,
      },
    );
    return undefined;
  }
  return PropertyValuetype.DECIMAL;
};
