// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type ValidationContext } from '../../validation/validation-context';
import {
  type BinaryExpression,
  type TernaryExpression,
  type UnaryExpression,
} from '../generated/ast';
import { type WrapperFactoryProvider } from '../wrappers';

import { evaluateExpression } from './evaluate-expression';
import { type EvaluationContext } from './evaluation-context';
import { EvaluationStrategy } from './evaluation-strategy';
import {
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  type InternalValidValueRepresentationTypeguard,
} from './internal-value-representation';
import {
  type BinaryExpressionOperator,
  type TernaryExpressionOperator,
  type UnaryExpressionOperator,
} from './operator-types';
import {
  ERROR_TYPEGUARD,
  INVALID_TYPEGUARD,
  MISSING_TYPEGUARD,
} from './typeguards';

export interface OperatorEvaluator<
  E extends UnaryExpression | BinaryExpression | TernaryExpression,
> {
  readonly operator: E['operator'];

  /**
   * @return the value the expression evaluates to or `undefined` if the evaluation failed.
   */
  evaluate(
    expression: E,
    evaluationContext: EvaluationContext,
    wrapperFactories: WrapperFactoryProvider,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): InternalValidValueRepresentation | InternalErrorValueRepresentation;
}

export abstract class DefaultUnaryOperatorEvaluator<
  O extends InternalValidValueRepresentation,
  T extends InternalValidValueRepresentation,
> implements OperatorEvaluator<UnaryExpression>
{
  constructor(
    public readonly operator: UnaryExpressionOperator,
    private readonly operandValueTypeguard: InternalValidValueRepresentationTypeguard<O>,
  ) {}

  protected abstract doEvaluate(
    operandValue: O,
    expression: UnaryExpression,
    context: ValidationContext | undefined,
  ): T | InternalErrorValueRepresentation;

  evaluate(
    expression: UnaryExpression,
    evaluationContext: EvaluationContext,
    wrapperFactories: WrapperFactoryProvider,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): T | InternalErrorValueRepresentation {
    assert(expression.operator === this.operator);
    const operandValue = evaluateExpression(
      expression.expression,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );
    if (ERROR_TYPEGUARD(operandValue)) {
      return operandValue;
    }

    assert(this.operandValueTypeguard(operandValue));

    return this.doEvaluate(operandValue, expression, validationContext);
  }
}

export abstract class DefaultBinaryOperatorEvaluator<
  L extends InternalValidValueRepresentation,
  R extends InternalValidValueRepresentation,
  T extends InternalValidValueRepresentation,
> implements OperatorEvaluator<BinaryExpression>
{
  constructor(
    public readonly operator: BinaryExpressionOperator,
    private readonly leftValueTypeguard: InternalValidValueRepresentationTypeguard<L>,
    private readonly rightValueTypeguard: InternalValidValueRepresentationTypeguard<R>,
  ) {}

  protected abstract doEvaluate(
    leftValue: L,
    rightValue: R,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): T | InternalErrorValueRepresentation;

  evaluate(
    expression: BinaryExpression,
    evaluationContext: EvaluationContext,
    wrapperFactories: WrapperFactoryProvider,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): T | InternalErrorValueRepresentation {
    assert(expression.operator === this.operator);
    const leftValue = evaluateExpression(
      expression.left,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );
    if (strategy === EvaluationStrategy.LAZY && ERROR_TYPEGUARD(leftValue)) {
      return leftValue;
    }
    const rightValue = evaluateExpression(
      expression.right,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );
    if (INVALID_TYPEGUARD(leftValue)) {
      return leftValue;
    }
    if (INVALID_TYPEGUARD(rightValue)) {
      return rightValue;
    }
    if (MISSING_TYPEGUARD(leftValue)) {
      return leftValue;
    }
    if (MISSING_TYPEGUARD(rightValue)) {
      return rightValue;
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
    wrapperFactories: WrapperFactoryProvider,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): boolean | InternalErrorValueRepresentation {
    assert(expression.operator === this.operator);
    const leftValue = evaluateExpression(
      expression.left,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );
    assert(ERROR_TYPEGUARD(leftValue) || typeof leftValue === 'boolean');
    if (strategy === EvaluationStrategy.LAZY) {
      if (ERROR_TYPEGUARD(leftValue)) {
        return leftValue;
      }
      if (this.canSkipRightOperandEvaluation(leftValue)) {
        return this.getShortCircuitValue();
      }
    }

    const rightValue = evaluateExpression(
      expression.right,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );
    if (INVALID_TYPEGUARD(leftValue)) {
      return leftValue;
    }
    if (INVALID_TYPEGUARD(rightValue)) {
      return rightValue;
    }
    if (MISSING_TYPEGUARD(leftValue)) {
      return leftValue;
    }
    if (MISSING_TYPEGUARD(rightValue)) {
      return rightValue;
    }
    assert(typeof rightValue === 'boolean');

    return this.doEvaluate(leftValue, rightValue);
  }
}

export abstract class DefaultTernaryOperatorEvaluator<
  FirstValue extends InternalValidValueRepresentation,
  SecondValue extends InternalValidValueRepresentation,
  ThirdValue extends InternalValidValueRepresentation,
  ReturnValue extends InternalValidValueRepresentation,
> implements OperatorEvaluator<TernaryExpression>
{
  constructor(
    public readonly operator: TernaryExpressionOperator,
    private readonly firstValueTypeguard: InternalValidValueRepresentationTypeguard<FirstValue>,
    private readonly secondValueTypeguard: InternalValidValueRepresentationTypeguard<SecondValue>,
    private readonly thirdValueTypeguard: InternalValidValueRepresentationTypeguard<ThirdValue>,
  ) {}

  protected abstract doEvaluate(
    firstValue: FirstValue,
    secondValue: SecondValue,
    thirdValue: ThirdValue,
    expression: TernaryExpression,
    context: ValidationContext | undefined,
  ): ReturnValue | InternalErrorValueRepresentation;

  evaluate(
    expression: TernaryExpression,
    evaluationContext: EvaluationContext,
    wrapperFactories: WrapperFactoryProvider,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): ReturnValue | InternalErrorValueRepresentation {
    // The following linting exception can be removed when a second ternary operator is added

    assert(expression.operator === this.operator);

    const firstValue = evaluateExpression(
      expression.first,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );

    if (strategy === EvaluationStrategy.LAZY && ERROR_TYPEGUARD(firstValue)) {
      return firstValue;
    }

    const secondValue = evaluateExpression(
      expression.second,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );

    const thirdValue = evaluateExpression(
      expression.third,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );

    if (INVALID_TYPEGUARD(firstValue)) {
      return firstValue;
    }
    if (INVALID_TYPEGUARD(secondValue)) {
      return secondValue;
    }
    if (INVALID_TYPEGUARD(thirdValue)) {
      return thirdValue;
    }
    if (MISSING_TYPEGUARD(firstValue)) {
      return firstValue;
    }
    if (MISSING_TYPEGUARD(secondValue)) {
      return secondValue;
    }
    if (MISSING_TYPEGUARD(thirdValue)) {
      return thirdValue;
    }

    assert(this.firstValueTypeguard(firstValue));
    assert(this.secondValueTypeguard(secondValue));
    assert(this.thirdValueTypeguard(thirdValue));

    return this.doEvaluate(
      firstValue,
      secondValue,
      thirdValue,
      expression,
      validationContext,
    );
  }
}
