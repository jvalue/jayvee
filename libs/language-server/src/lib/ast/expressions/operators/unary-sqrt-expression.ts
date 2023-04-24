// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { UnaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { PropertyValuetype, isNumericType } from '../../model-util';
import { evaluateExpression } from '../evaluation';
import {
  EvaluationFunction,
  EvaluationStrategy,
  UnaryTypeInferenceFunction,
} from '../operator-registry';

export const inferUnarySqrtExpressionType: UnaryTypeInferenceFunction = (
  innerType: PropertyValuetype,
  expression: UnaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined => {
  assert(expression.operator === 'sqrt');
  if (!isNumericType(innerType)) {
    context?.accept(
      'error',
      `The operand needs to be of type ${PropertyValuetype.INTEGER} or ${PropertyValuetype.DECIMAL} but is of type ${innerType}`,
      {
        node: expression.expression,
      },
    );
    return undefined;
  }
  return PropertyValuetype.DECIMAL;
};

export const evaluateUnarySqrtExpression: EvaluationFunction<
  UnaryExpression
> = (
  expression: UnaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === 'sqrt');
  const innerValue = evaluateExpression(
    expression.expression,
    strategy,
    context,
  );
  if (innerValue === undefined) {
    return undefined;
  }
  assert(typeof innerValue === 'number');

  const resultingValue = Math.sqrt(innerValue);

  if (!isFinite(resultingValue)) {
    assert(innerValue < 0);
    context?.accept(
      'error',
      'Arithmetic error: square root of negative number',
      { node: expression },
    );
    return undefined;
  }
  return resultingValue;
};
