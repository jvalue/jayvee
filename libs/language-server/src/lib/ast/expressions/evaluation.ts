// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable, isReference } from 'langium';

import { ValidationContext } from '../../validation/validation-context';
import {
  CollectionLiteral,
  ConstraintDefinition,
  Expression,
  ExpressionLiteral,
  TransformerPortDefinition,
  ValuetypeAssignment,
  isBinaryExpression,
  isCellRangeLiteral,
  isCollectionLiteral,
  isExpressionLiteral,
  isRegexLiteral,
  isUnaryExpression,
  isVariableLiteral,
} from '../generated/ast';
import { CellRangeWrapper } from '../wrappers/cell-range-wrapper';

// eslint-disable-next-line import/no-cycle
import {
  binaryOperatorRegistry,
  unaryOperatorRegistry,
} from './operator-registry';

export enum EvaluationStrategy {
  EXHAUSTIVE,
  LAZY,
}

export type OperandValue =
  | boolean
  | number
  | string
  | RegExp
  | CellRangeWrapper
  | ConstraintDefinition
  | ValuetypeAssignment
  | CollectionLiteral
  | TransformerPortDefinition;
export type OperandValueTypeguard<T extends OperandValue> = (
  value: OperandValue,
) => value is T;

export function evaluatePropertyValueExpression<T extends OperandValue>(
  propertyValue: Expression,
  typeguard: OperandValueTypeguard<T>,
): T {
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
    if (isVariableLiteral(expression)) {
      return undefined; // TODO
    }
    return evaluateExpressionLiteral(expression);
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

function evaluateExpressionLiteral(
  expression: ExpressionLiteral,
): OperandValue | undefined {
  if (isCollectionLiteral(expression)) {
    return expression;
  }
  if (isCellRangeLiteral(expression)) {
    if (!CellRangeWrapper.canBeWrapped(expression)) {
      return undefined;
    }
    return new CellRangeWrapper(expression);
  }
  if (isRegexLiteral(expression)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (expression?.value === undefined) {
      return undefined;
    }
    return new RegExp(expression.value);
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isReference(expression?.value)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return expression?.value?.ref;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return expression?.value;
}
