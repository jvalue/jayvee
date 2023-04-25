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

export const inferBinaryExponentialExpressionType: BinaryTypeInferenceFunction =
  (
    leftType: PropertyValuetype,
    rightType: PropertyValuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined => {
    assert(expression.operator === 'pow' || expression.operator === 'root');
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
    return PropertyValuetype.DECIMAL;
  };

export const evaluateBinaryPowExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === 'pow');
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

  const resultingValue = leftValue ** rightValue;

  if (!isFinite(resultingValue)) {
    if (leftValue === 0 && rightValue < 0) {
      context?.accept(
        'error',
        'Arithmetic error: zero raised to a negative number',
        { node: expression },
      );
    } else {
      context?.accept('error', 'Unknown arithmetic error', {
        node: expression,
      });
    }
    return undefined;
  }

  return resultingValue;
};

export const evaluateBinaryRootExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === 'root');
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

  const resultingValue = leftValue ** (1 / rightValue);

  if (!isFinite(resultingValue)) {
    if (leftValue === 0 && rightValue < 0) {
      context?.accept(
        'error',
        'Arithmetic error: root of zero with negative degree',
        { node: expression },
      );
    } else if (rightValue === 0) {
      context?.accept('error', 'Arithmetic error: root of degree zero', {
        node: expression,
      });
    } else {
      context?.accept('error', 'Unknown arithmetic error', {
        node: expression,
      });
    }
    return undefined;
  }

  return resultingValue;
};
