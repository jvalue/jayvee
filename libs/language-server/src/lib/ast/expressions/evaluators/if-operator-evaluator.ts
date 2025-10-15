// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import { type ValidationContext } from '../../../validation';
import { type TernaryExpression } from '../../generated/ast';
import { type WrapperFactoryProvider } from '../../wrappers';
import { type EvaluationContext } from '../evaluation-context';
import { type EvaluationStrategy } from '../evaluation-strategy';
import { type OperatorEvaluator } from '../operator-evaluator';
import { BOOLEAN_TYPEGUARD, ERROR_TYPEGUARD } from '../typeguards';
import {
  type InternalValidValueRepresentation,
  InvalidValue,
  type InternalErrorValueRepresentation,
} from '../internal-value-representation';
import { evaluateExpression } from '../evaluate-expression';

export class IfOperatorEvaluator
  implements OperatorEvaluator<TernaryExpression>
{
  public readonly operator = 'if' as const;

  evaluate(
    expression: TernaryExpression,
    evaluationContext: EvaluationContext,
    wrapperFactories: WrapperFactoryProvider,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): InternalValidValueRepresentation | InternalErrorValueRepresentation {
    assert(expression.operator === this.operator);

    // format: {thenExpresssion} if {conditionExpression} else {elseExpression}
    const thenExpression = expression.first;
    const conditionExpression = expression.second;
    const elseExpression = expression.third;

    const condition = evaluateExpression(
      conditionExpression,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );

    if (ERROR_TYPEGUARD(condition)) {
      return condition;
    } else if (!BOOLEAN_TYPEGUARD(condition)) {
      return new InvalidValue('If condition did not evaluate to a boolean');
    }

    const branchExpression = condition ? thenExpression : elseExpression;

    return evaluateExpression(
      branchExpression,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );
  }
}
