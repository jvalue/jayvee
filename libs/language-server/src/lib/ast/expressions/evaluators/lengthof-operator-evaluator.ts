// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import { type ValidationContext } from '../../../validation/validation-context';
import { type UnaryExpression } from '../../generated/ast';
import { type WrapperFactoryProvider } from '../../wrappers/wrapper-factory-provider';
import { evaluateExpression } from '../evaluate-expression';
import { type EvaluationContext } from '../evaluation-context';
import { type EvaluationStrategy } from '../evaluation-strategy';
import { type OperatorEvaluator } from '../operator-evaluator';
import { COLLECTION_TYPEGUARD, STRING_TYPEGUARD } from '../typeguards';

export class LengthofOperatorEvaluator
  implements OperatorEvaluator<UnaryExpression>
{
  readonly operator = 'lengthof' as const;

  evaluate(
    expression: UnaryExpression,
    evaluationContext: EvaluationContext,
    wrapperFactories: WrapperFactoryProvider,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): number | undefined {
    assert(expression.operator === this.operator);
    const operandValue = evaluateExpression(
      expression.expression,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );
    if (operandValue === undefined) {
      return undefined;
    }

    if (STRING_TYPEGUARD(operandValue)) {
      return operandValue.length;
    } else if (COLLECTION_TYPEGUARD(operandValue)) {
      return operandValue.length;
    }

    return undefined;
  }
}
