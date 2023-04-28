// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../validation/validation-context';
import { BinaryExpression, UnaryExpression } from '../generated/ast';
// eslint-disable-next-line import/no-cycle
import {
  BinaryExpressionOperator,
  UnaryExpressionOperator,
} from '../model-util';

import { EvaluationStrategy, evaluateExpression } from './evaluation';

export type OperandValue = boolean | number | string;

export type OperandValueTypeguard<T extends OperandValue> = (
  value: OperandValue,
) => value is T;

export const OPERAND_VALUE_TYPEGUARD: OperandValueTypeguard<OperandValue> = (
  value: OperandValue,
): value is OperandValue => {
  return true;
};

export const NUMBER_TYPEGUARD: OperandValueTypeguard<number> = (
  value: OperandValue,
): value is number => {
  return typeof value === 'number';
};

export const BOOLEAN_TYPEGUARD: OperandValueTypeguard<boolean> = (
  value: OperandValue,
): value is boolean => {
  return typeof value === 'boolean';
};

export interface OperatorEvaluator<
  E extends UnaryExpression | BinaryExpression,
> {
  readonly operator: E['operator'];

  evaluate(
    expression: E,
    strategy: EvaluationStrategy,
    context: ValidationContext | undefined,
  ): OperandValue | undefined;
}

export abstract class DefaultUnaryOperatorEvaluator<
  O extends OperandValue,
  T extends OperandValue,
> implements OperatorEvaluator<UnaryExpression>
{
  constructor(
    public readonly operator: UnaryExpressionOperator,
    private readonly operandValueTypeguard: OperandValueTypeguard<O>,
  ) {}

  protected abstract doEvaluate(
    operandValue: O,
    expression: UnaryExpression,
    context: ValidationContext | undefined,
  ): T | undefined;

  evaluate(
    expression: UnaryExpression,
    strategy: EvaluationStrategy,
    context: ValidationContext | undefined,
  ): T | undefined {
    assert(expression.operator === this.operator);
    const operandValue = evaluateExpression(
      expression.expression,
      strategy,
      context,
    );
    if (operandValue === undefined) {
      return undefined;
    }

    assert(this.operandValueTypeguard(operandValue));

    return this.doEvaluate(operandValue, expression, context);
  }
}

export abstract class DefaultBinaryOperatorEvaluator<
  L extends OperandValue,
  R extends OperandValue,
  T extends OperandValue,
> implements OperatorEvaluator<BinaryExpression>
{
  constructor(
    public readonly operator: BinaryExpressionOperator,
    private readonly leftValueTypeguard: OperandValueTypeguard<L>,
    private readonly rightValueTypeguard: OperandValueTypeguard<R>,
  ) {}

  protected abstract doEvaluate(
    leftValue: L,
    rightValue: R,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): T | undefined;

  evaluate(
    expression: BinaryExpression,
    strategy: EvaluationStrategy,
    context: ValidationContext | undefined,
  ): T | undefined {
    assert(expression.operator === this.operator);
    const leftValue = evaluateExpression(expression.left, strategy, context);
    if (strategy === EvaluationStrategy.LAZY && leftValue === undefined) {
      return undefined;
    }
    const rightValue = evaluateExpression(expression.right, strategy, context);
    if (leftValue === undefined || rightValue === undefined) {
      return undefined;
    }

    assert(this.leftValueTypeguard(leftValue));
    assert(this.rightValueTypeguard(rightValue));

    return this.doEvaluate(leftValue, rightValue, expression, context);
  }
}

/**
 * This class serves as a base for boolean operators that support short-circuit evaluation.
 * Short-circuit evaluation means that the right operand is not evaluated
 * if the resulting value can be determined by solely evaluating the left operand.
 */
export abstract class BooleanShortCircuitOperatorEvaluator
  implements OperatorEvaluator<BinaryExpression>
{
  constructor(public readonly operator: 'and' | 'or') {}

  protected abstract canSkipRightOperandEvaluation(leftValue: boolean): boolean;
  protected abstract getShortCircuitValue(): boolean;

  protected abstract doEvaluate(
    leftValue: boolean,
    rightValue: boolean,
  ): boolean;

  evaluate(
    expression: BinaryExpression,
    strategy: EvaluationStrategy,
    context: ValidationContext | undefined,
  ): boolean | undefined {
    assert(expression.operator === this.operator);
    const leftValue = evaluateExpression(expression.left, strategy, context);
    assert(leftValue === undefined || typeof leftValue === 'boolean');
    if (strategy === EvaluationStrategy.LAZY) {
      if (leftValue === undefined) {
        return undefined;
      }
      if (this.canSkipRightOperandEvaluation(leftValue)) {
        return this.getShortCircuitValue();
      }
    }

    const rightValue = evaluateExpression(expression.right, strategy, context);
    if (leftValue === undefined || rightValue === undefined) {
      return undefined;
    }
    assert(typeof rightValue === 'boolean');

    return this.doEvaluate(leftValue, rightValue);
  }
}
