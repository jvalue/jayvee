// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type BinaryExpression } from '../../generated/ast';
import { type OperatorEvaluator } from '../operator-evaluator';
import { type EvaluationContext } from '../evaluation-context';
import { type WrapperFactoryProvider } from '../../wrappers';
import { EvaluationStrategy } from '../evaluation-strategy';
import { type ValidationContext } from '../../../validation';
import {
  InvalidValue,
  MissingValue,
  type InternalErrorValueRepresentation,
} from '../internal-value-representation';
// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';
import { evaluateExpression } from '../evaluate-expression';
import {
  COLLECTION_TYPEGUARD,
  ERROR_TYPEGUARD,
  INVALID_TYPEGUARD,
  MISSING_TYPEGUARD,
  NUMBER_TYPEGUARD,
  STRING_TYPEGUARD,
} from '../typeguards';

export class CellInColumnOperatorEvaluator
  implements OperatorEvaluator<BinaryExpression>
{
  public readonly operator = 'cellInColumn' as const;

  evaluate(
    expression: BinaryExpression,
    evaluationContext: EvaluationContext,
    wrapperFactories: WrapperFactoryProvider,
    strategy: EvaluationStrategy,
    validationContext: ValidationContext | undefined,
  ): string | InternalErrorValueRepresentation {
    assert(expression.operator === this.operator);

    const sheetRowValues = evaluateExpression(
      expression.left,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );

    if (
      strategy === EvaluationStrategy.LAZY &&
      ERROR_TYPEGUARD(sheetRowValues)
    ) {
      return sheetRowValues;
    }

    const accessor = evaluateExpression(
      expression.right,
      evaluationContext,
      wrapperFactories,
      validationContext,
      strategy,
    );
    if (INVALID_TYPEGUARD(sheetRowValues)) {
      return sheetRowValues;
    }
    if (INVALID_TYPEGUARD(accessor)) {
      return accessor;
    }
    if (MISSING_TYPEGUARD(sheetRowValues)) {
      return sheetRowValues;
    }
    if (MISSING_TYPEGUARD(accessor)) {
      return accessor;
    }

    assert(COLLECTION_TYPEGUARD(sheetRowValues));
    assert(sheetRowValues.every((value) => STRING_TYPEGUARD(value)));

    assert(STRING_TYPEGUARD(accessor) || NUMBER_TYPEGUARD(accessor));

    const index =
      typeof accessor === 'string'
        ? evaluationContext.getColumnIndex(accessor)
        : accessor;
    if (index === undefined) {
      validationContext?.accept(
        'error',
        `Could not find index for column "${accessor}"`,
        {
          node: expression.right,
        },
      );
      return new MissingValue(`Could not find index for column ${accessor}`);
    }

    if (index >= sheetRowValues.length) {
      return new InvalidValue(
        `Cannot access column ${index} in a sheet with only ${sheetRowValues.length} columns`,
      );
    }
    const value = sheetRowValues.at(index);
    assert(value !== undefined);
    return value;
  }
}
