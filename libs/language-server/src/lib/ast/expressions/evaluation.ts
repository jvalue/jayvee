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
  EvaluationStrategy,
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from './operator-registry';

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
    const evaluationFn = unaryOperatorRegistry[operator].evaluation;
    return evaluationFn(expression, strategy, context);
  }
  if (isBinaryExpression(expression)) {
    const operator = expression.operator;
    const evaluationFn = binaryOperatorRegistry[operator].evaluation;
    return evaluationFn(expression, strategy, context);
  }
  assertUnreachable(expression);
}
