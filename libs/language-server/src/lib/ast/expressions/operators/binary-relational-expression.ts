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

export const inferBinaryRelationalExpressionType: BinaryTypeInferenceFunction =
  (
    leftType: PropertyValuetype,
    rightType: PropertyValuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined => {
    assert(
      expression.operator === '<' ||
        expression.operator === '<=' ||
        expression.operator === '>' ||
        expression.operator === '>=',
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
    if (leftType !== rightType) {
      context?.accept(
        'warning',
        `The operands are of different numeric types (left: ${leftType}, right: ${rightType})`,
        {
          node: expression,
        },
      );
    }
    return PropertyValuetype.BOOLEAN;
  };

export const evaluateBinaryLessThanExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '<');
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

  return leftValue < rightValue;
};

export const evaluateBinaryLessEqualExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '<=');
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

  return leftValue <= rightValue;
};

export const evaluateBinaryGreaterThanExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '<=');
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

  return leftValue > rightValue;
};

export const evaluateBinaryGreaterEqualExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === '>=');
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

  return leftValue >= rightValue;
};
