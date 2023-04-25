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
import { evaluateExpression } from '../evaluation';
import {
  BinaryTypeInferenceFunction,
  EvaluationFunction,
  EvaluationStrategy,
} from '../operator-registry';
import { generateUnexpectedTypeMessage } from '../type-inference';

export const inferBinaryArithmeticExpressionType: BinaryTypeInferenceFunction =
  (
    leftType: PropertyValuetype,
    rightType: PropertyValuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined => {
    assert(
      expression.operator === '+' ||
        expression.operator === '-' ||
        expression.operator === '*' ||
        expression.operator === '/' ||
        expression.operator === '%',
    );

    if (!isNumericType(leftType) || !isNumericType(rightType)) {
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
      return undefined;
    }
    if (
      leftType === PropertyValuetype.INTEGER &&
      rightType === PropertyValuetype.INTEGER &&
      expression.operator !== '/'
    ) {
      return PropertyValuetype.INTEGER;
    }
    return PropertyValuetype.DECIMAL;
  };

export const evaluateBinaryMultiplicationExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '*');
  const leftValue = evaluateExpression(expression.left, strategy, context);
  if (leftValue === undefined && strategy === EvaluationStrategy.LAZY) {
    return undefined;
  }
  const rightValue = evaluateExpression(expression.right, strategy, context);
  if (leftValue === undefined || rightValue === undefined) {
    return undefined;
  }

  assert(typeof leftValue === 'number');
  assert(typeof rightValue === 'number');

  return leftValue * rightValue;
};

export const evaluateBinaryDivisionExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '/');
  const leftValue = evaluateExpression(expression.left, strategy, context);
  if (leftValue === undefined && strategy === EvaluationStrategy.LAZY) {
    return undefined;
  }
  const rightValue = evaluateExpression(expression.right, strategy, context);
  if (leftValue === undefined || rightValue === undefined) {
    return undefined;
  }

  assert(typeof leftValue === 'number');
  assert(typeof rightValue === 'number');

  const resultingValue = leftValue / rightValue;

  if (!isFinite(resultingValue)) {
    assert(rightValue === 0);
    context?.accept('error', 'Arithmetic error: division by zero', {
      node: expression,
    });
    return undefined;
  }

  return resultingValue;
};

export const evaluateBinaryModuloExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '%');
  const leftValue = evaluateExpression(expression.left, strategy, context);
  if (leftValue === undefined && strategy === EvaluationStrategy.LAZY) {
    return undefined;
  }
  const rightValue = evaluateExpression(expression.right, strategy, context);
  if (leftValue === undefined || rightValue === undefined) {
    return undefined;
  }

  assert(typeof leftValue === 'number');
  assert(typeof rightValue === 'number');

  const resultingValue = leftValue % rightValue;

  if (!isFinite(resultingValue)) {
    assert(rightValue === 0);
    context?.accept('error', 'Arithmetic error: modulo by zero', {
      node: expression,
    });
    return undefined;
  }

  return resultingValue;
};

export const evaluateBinaryAdditionExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '+');
  const leftValue = evaluateExpression(expression.left, strategy, context);
  if (leftValue === undefined && strategy === EvaluationStrategy.LAZY) {
    return undefined;
  }
  const rightValue = evaluateExpression(expression.right, strategy, context);
  if (leftValue === undefined || rightValue === undefined) {
    return undefined;
  }

  assert(typeof leftValue === 'number');
  assert(typeof rightValue === 'number');

  return leftValue + rightValue;
};

export const evaluateBinarySubtractionExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '-');
  const leftValue = evaluateExpression(expression.left, strategy, context);
  if (leftValue === undefined && strategy === EvaluationStrategy.LAZY) {
    return undefined;
  }
  const rightValue = evaluateExpression(expression.right, strategy, context);
  if (leftValue === undefined || rightValue === undefined) {
    return undefined;
  }

  assert(typeof leftValue === 'number');
  assert(typeof rightValue === 'number');

  return leftValue - rightValue;
};
