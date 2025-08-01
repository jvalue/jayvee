// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValidationContext } from '../../../validation/validation-context';
import { type BinaryExpression } from '../../generated/ast';
import { InvalidError } from '../internal-value-representation';
import { DefaultBinaryOperatorEvaluator } from '../operator-evaluator';
import { NUMBER_TYPEGUARD } from '../typeguards';

export class ModuloOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  number,
  number,
  number
> {
  constructor() {
    super('%', NUMBER_TYPEGUARD, NUMBER_TYPEGUARD);
  }

  override doEvaluate(
    leftValue: number,
    rightValue: number,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): number | InvalidError {
    const resultingValue = leftValue % rightValue;

    if (!isFinite(resultingValue)) {
      if (rightValue === 0) {
        context?.accept('error', 'Arithmetic error: modulo by zero', {
          node: expression,
        });
        return new InvalidError('Cannot compute modulo by zero');
      }
      context?.accept('error', 'Unknown arithmetic error', {
        node: expression,
      });
      return new InvalidError(
        `Failed to compute ${leftValue} modulo ${rightValue}`,
      );
    }
    return resultingValue;
  }
}
