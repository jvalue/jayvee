// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assertUnreachable } from 'langium';

import { ValidationContext } from '../../validation/validation-context';
import {
  Expression,
  isBinaryExpression,
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

export function evaluateExpression(
  expression: Expression,
  strategy: EvaluationStrategy = EvaluationStrategy.LAZY,
  context: ValidationContext | undefined = undefined,
): boolean | number | string | undefined {
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
