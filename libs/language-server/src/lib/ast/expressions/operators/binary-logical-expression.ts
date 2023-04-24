// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { BinaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { PropertyValuetype } from '../../model-util';
import { evaluateExpression } from '../evaluation';
import {
  BinaryTypeInferenceFunction,
  EvaluationFunction,
  EvaluationStrategy,
} from '../operator-registry';

export const inferBinaryLogicalExpressionType: BinaryTypeInferenceFunction = (
  leftType: PropertyValuetype,
  rightType: PropertyValuetype,
  expression: BinaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined => {
  assert(
    expression.operator === 'xor' ||
      expression.operator === 'and' ||
      expression.operator === 'or',
  );

  if (
    leftType !== PropertyValuetype.BOOLEAN ||
    rightType !== PropertyValuetype.BOOLEAN
  ) {
    if (leftType !== PropertyValuetype.BOOLEAN) {
      context?.accept(
        'error',
        `The operand needs to be of type ${PropertyValuetype.BOOLEAN} but is of type ${leftType}`,
        {
          node: expression.left,
        },
      );
    }
    if (rightType !== PropertyValuetype.BOOLEAN) {
      context?.accept(
        'error',
        `The operand needs to be of type ${PropertyValuetype.BOOLEAN} but is of type ${rightType}`,
        {
          node: expression.right,
        },
      );
    }
    return undefined;
  }
  return PropertyValuetype.BOOLEAN;
};

export const evaluateBinaryXorExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === 'xor');
  const leftValue = evaluateExpression(expression.left, strategy, context);
  if (leftValue === undefined && strategy === EvaluationStrategy.LAZY) {
    return undefined;
  }
  const rightValue = evaluateExpression(expression.right, strategy, context);
  if (leftValue === undefined || rightValue === undefined) {
    return undefined;
  }

  assert(typeof leftValue === 'boolean');
  assert(typeof rightValue === 'boolean');
  return (leftValue && !rightValue) || (!leftValue && rightValue);
};

export const evaluateBinaryAndExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === 'and');
  const leftValue = evaluateExpression(expression.left, strategy, context);
  if (leftValue === undefined && strategy === EvaluationStrategy.LAZY) {
    return undefined;
  }
  if (leftValue === false && strategy === EvaluationStrategy.LAZY) {
    return false;
  }
  const rightValue = evaluateExpression(expression.right, strategy, context);
  if (leftValue === undefined || rightValue === undefined) {
    return undefined;
  }

  assert(typeof leftValue === 'boolean');
  assert(typeof rightValue === 'boolean');
  return leftValue && rightValue;
};

export const evaluateBinaryOrExpression: EvaluationFunction<
  BinaryExpression
> = (
  expression: BinaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === 'or');
  const leftValue = evaluateExpression(expression.left, strategy, context);
  if (leftValue === undefined && strategy === EvaluationStrategy.LAZY) {
    return undefined;
  }

  if (leftValue === true && strategy === EvaluationStrategy.LAZY) {
    return true;
  }
  const rightValue = evaluateExpression(expression.right, strategy, context);
  if (leftValue === undefined || rightValue === undefined) {
    return undefined;
  }
  assert(typeof leftValue === 'boolean');
  assert(typeof rightValue === 'boolean');
  return leftValue || rightValue;
};
