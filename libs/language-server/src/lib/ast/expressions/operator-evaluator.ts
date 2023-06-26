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

import {
  EvaluationContext,
  EvaluationStrategy,
  evaluateExpression,
} from './evaluation';
import {
  InternalValueRepresentation,
  InternalValueRepresentationTypeguard,
} from './internal-value-representation';

export interface OperatorEvaluator<
  E extends UnaryExpression | BinaryExpression,
> {
  readonly operator: E['operator'];

  /**
   * @return the value the expression evaluates to or `undefined` if the evaluation failed.
   */
  evaluate(
    expression: E,
    evaluationContext: EvaluationContext,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): InternalValueRepresentation | undefined;
}

export abstract class DefaultUnaryOperatorEvaluator<
  O extends InternalValueRepresentation,
  T extends InternalValueRepresentation,
> implements OperatorEvaluator<UnaryExpression>
{
  constructor(
    public readonly operator: UnaryExpressionOperator,
    private readonly operandValueTypeguard: InternalValueRepresentationTypeguard<O>,
  ) {}

  protected abstract doEvaluate(
    operandValue: O,
    expression: UnaryExpression,
    context: ValidationContext | undefined,
  ): T | undefined;

  evaluate(
    expression: UnaryExpression,
    evaluationContext: EvaluationContext,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): T | undefined {
    assert(expression.operator === this.operator);
    const operandValue = evaluateExpression(
      expression.expression,
      evaluationContext,
      validationContext,
      strategy,
    );
    if (operandValue === undefined) {
      return undefined;
    }

    assert(this.operandValueTypeguard(operandValue));

    return this.doEvaluate(operandValue, expression, validationContext);
  }
}

export abstract class DefaultBinaryOperatorEvaluator<
  L extends InternalValueRepresentation,
  R extends InternalValueRepresentation,
  T extends InternalValueRepresentation,
> implements OperatorEvaluator<BinaryExpression>
{
  constructor(
    public readonly operator: BinaryExpressionOperator,
    private readonly leftValueTypeguard: InternalValueRepresentationTypeguard<L>,
    private readonly rightValueTypeguard: InternalValueRepresentationTypeguard<R>,
  ) {}

  protected abstract doEvaluate(
    leftValue: L,
    rightValue: R,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): T | undefined;

  evaluate(
    expression: BinaryExpression,
    evaluationContext: EvaluationContext,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): T | undefined {
    assert(expression.operator === this.operator);
    const leftValue = evaluateExpression(
      expression.left,
      evaluationContext,
      validationContext,
      strategy,
    );
    if (strategy === EvaluationStrategy.LAZY && leftValue === undefined) {
      return undefined;
    }
    const rightValue = evaluateExpression(
      expression.right,
      evaluationContext,
      validationContext,
      strategy,
    );
    if (leftValue === undefined || rightValue === undefined) {
      return undefined;
    }

    assert(this.leftValueTypeguard(leftValue));
    assert(this.rightValueTypeguard(rightValue));

    return this.doEvaluate(
      leftValue,
      rightValue,
      expression,
      validationContext,
    );
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
    evaluationContext: EvaluationContext,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): boolean | undefined {
    assert(expression.operator === this.operator);
    const leftValue = evaluateExpression(
      expression.left,
      evaluationContext,
      validationContext,
      strategy,
    );
    assert(leftValue === undefined || typeof leftValue === 'boolean');
    if (strategy === EvaluationStrategy.LAZY) {
      if (leftValue === undefined) {
        return undefined;
      }
      if (this.canSkipRightOperandEvaluation(leftValue)) {
        return this.getShortCircuitValue();
      }
    }

    const rightValue = evaluateExpression(
      expression.right,
      evaluationContext,
      validationContext,
      strategy,
    );
    if (leftValue === undefined || rightValue === undefined) {
      return undefined;
    }
    assert(typeof rightValue === 'boolean');

    return this.doEvaluate(leftValue, rightValue);
  }
}
