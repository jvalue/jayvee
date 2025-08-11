// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValidationContext } from '../../../validation/validation-context';
import { type BinaryExpression } from '../../generated/ast';
import { InvalidValue } from '../internal-value-representation';
import { DefaultBinaryOperatorEvaluator } from '../operator-evaluator';
import { NUMBER_TYPEGUARD } from '../typeguards';

export class RootOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  number,
  number,
  number
> {
  constructor() {
    super('root', NUMBER_TYPEGUARD, NUMBER_TYPEGUARD);
  }

  override doEvaluate(
    leftValue: number,
    rightValue: number,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): number | InvalidValue {
    const resultingValue = leftValue ** (1 / rightValue);

    if (!isFinite(resultingValue)) {
      if (leftValue === 0 && rightValue < 0) {
        context?.accept(
          'error',
          'Arithmetic error: root of zero with negative degree',
          { node: expression },
        );
        return new InvalidValue(
          'Cannot compute the root of zero with negative degree',
        );
      } else if (rightValue === 0) {
        context?.accept('error', 'Arithmetic error: root of degree zero', {
          node: expression,
        });
        return new InvalidValue('Cannot compute the root of degree zero');
      }
      context?.accept('error', 'Unknown arithmetic error', {
        node: expression,
      });
      return new InvalidValue(
        `Failed to compute the ${rightValue}th root of ${leftValue}`,
      );
    }
    return resultingValue;
  }
}
