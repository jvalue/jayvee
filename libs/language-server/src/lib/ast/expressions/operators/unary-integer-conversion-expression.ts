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
        `The operand needs to be of type ${PropertyValuetype.DECIMAL} but is of type ${innerType}`,
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

export const evaluateUnaryFloorExpression: EvaluationFunction<
  UnaryExpression
> = (
  expression: UnaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === 'floor');
  const innerValue = evaluateExpression(
    expression.expression,
    strategy,
    context,
  );
  if (innerValue === undefined) {
    return undefined;
  }
  assert(typeof innerValue === 'number');
  return Math.floor(innerValue);
};

export const evaluateUnaryCeilExpression: EvaluationFunction<
  UnaryExpression
> = (
  expression: UnaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === 'ceil');
  const innerValue = evaluateExpression(
    expression.expression,
    strategy,
    context,
  );
  if (innerValue === undefined) {
    return undefined;
  }
  assert(typeof innerValue === 'number');
  return Math.ceil(innerValue);
};

export const evaluateUnaryRoundExpression: EvaluationFunction<
  UnaryExpression
> = (
  expression: UnaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === 'round');
  const innerValue = evaluateExpression(
    expression.expression,
    strategy,
    context,
  );
  if (innerValue === undefined) {
    return undefined;
  }
  assert(typeof innerValue === 'number');
  return Math.round(innerValue);
};
