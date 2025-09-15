// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import { type ValidationContext } from '../../../validation';
import { type BinaryExpression } from '../../generated/ast';
import { type WrapperFactoryProvider } from '../../wrappers';
import { evaluateExpression } from '../evaluate-expression';
import { type EvaluationContext } from '../evaluation-context';
import { type EvaluationStrategy } from '../evaluation-strategy';
import {
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
} from '../internal-value-representation';
import { type OperatorEvaluator } from '../operator-evaluator';
import { INVALID_TYPEGUARD, MISSING_TYPEGUARD } from '../typeguards';

export class InequalityOperatorEvaluator
  implements OperatorEvaluator<BinaryExpression>
{
  public readonly operator = '!=' as const;

  evaluate(
    expression: BinaryExpression,
    evaluationContext: EvaluationContext,
    wrapperFactories: WrapperFactoryProvider,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): InternalValidValueRepresentation | InternalErrorValueRepresentation {
    assert(expression.operator === this.operator);
    const leftValue = evaluateExpression(
      expression.left,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );
    const rightValue = evaluateExpression(
      expression.right,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );

    if (INVALID_TYPEGUARD(leftValue)) {
      return !INVALID_TYPEGUARD(rightValue);
    }
    if (MISSING_TYPEGUARD(leftValue)) {
      return !MISSING_TYPEGUARD(rightValue);
    }

    return leftValue !== rightValue;
  }
}
