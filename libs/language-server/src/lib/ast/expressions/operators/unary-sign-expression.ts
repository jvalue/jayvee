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
import { evaluateExpression } from '../evaluation';
import {
  EvaluationFunction,
  EvaluationStrategy,
  UnaryTypeInferenceFunction,
} from '../operator-registry';
import { generateUnexpectedTypeMessage } from '../type-inference';

export const inferUnarySignExpressionType: UnaryTypeInferenceFunction = (
  innerType: PropertyValuetype,
  expression: UnaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined => {
  assert(expression.operator === '+' || expression.operator === '-');
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
  return innerType;
};

export const evaluateUnaryPlusExpression: EvaluationFunction<
  UnaryExpression
> = (
  expression: UnaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '+');
  const innerValue = evaluateExpression(
    expression.expression,
    strategy,
    context,
  );
  if (innerValue === undefined) {
    return undefined;
  }
  assert(typeof innerValue === 'number');
  return innerValue;
};

export const evaluateUnaryMinusExpression: EvaluationFunction<
  UnaryExpression
> = (
  expression: UnaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '-');
  const innerValue = evaluateExpression(
    expression.expression,
    strategy,
    context,
  );
  if (innerValue === undefined) {
    return undefined;
  }
  assert(typeof innerValue === 'number');
  return -innerValue;
};
