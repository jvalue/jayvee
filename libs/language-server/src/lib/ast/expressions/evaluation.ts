// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import { ValidationContext } from '../../validation/validation-context';
import {
  Expression,
  PropertyValueLiteral,
  RuntimeParameterLiteral,
  isBinaryExpression,
  isExpression,
  isExpressionLiteral,
  isUnaryExpression,
} from '../generated/ast';

// eslint-disable-next-line import/no-cycle
import {
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from './operator-registry';

export enum EvaluationStrategy {
  EXHAUSTIVE,
  LAZY,
}

export type OperandValue = boolean | number | string;
export type OperandValueTypeguard<T extends OperandValue> = (
  value: OperandValue,
) => value is T;

export function evaluatePropertyValueExpression<T extends OperandValue>(
  propertyValue: PropertyValueLiteral | RuntimeParameterLiteral,
  typeguard: OperandValueTypeguard<T>,
): T {
  assert(isExpression(propertyValue));
  const resultingValue = evaluateExpression(propertyValue);
  assert(resultingValue !== undefined);
  assert(typeguard(resultingValue));
  return resultingValue;
}

export function evaluateExpression(
  expression: Expression,
  strategy: EvaluationStrategy = EvaluationStrategy.LAZY,
  context: ValidationContext | undefined = undefined,
): OperandValue | undefined {
  if (isExpressionLiteral(expression)) {
    return expression.value;
  }
  if (isUnaryExpression(expression)) {
    const operator = expression.operator;
    const evaluator = unaryOperatorRegistry[operator].evaluation;
    return evaluator.evaluate(expression, strategy, context);
  }
  if (isBinaryExpression(expression)) {
    const operator = expression.operator;
    const evaluator = binaryOperatorRegistry[operator].evaluation;
    return evaluator.evaluate(expression, strategy, context);
  }
  assertUnreachable(expression);
}
