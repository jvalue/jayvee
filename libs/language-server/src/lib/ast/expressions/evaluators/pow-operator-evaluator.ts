// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValidationContext } from '../../../validation/validation-context';
import { type BinaryExpression } from '../../generated/ast';
import { DefaultBinaryOperatorEvaluator } from '../operator-evaluator';
import { NUMBER_TYPEGUARD } from '../typeguards';

export class PowOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  number,
  number,
  number
> {
  constructor() {
    super('pow', NUMBER_TYPEGUARD, NUMBER_TYPEGUARD);
  }

  override doEvaluate(
    leftValue: number,
    rightValue: number,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): number | undefined {
    const resultingValue = leftValue ** rightValue;

    if (!isFinite(resultingValue)) {
      if (leftValue === 0 && rightValue < 0) {
        context?.accept(
          'error',
          'Arithmetic error: zero raised to a negative number',
          { node: expression },
        );
      } else {
        context?.accept('error', 'Unknown arithmetic error', {
          node: expression,
        });
      }
      return undefined;
    }
    return resultingValue;
  }
}
