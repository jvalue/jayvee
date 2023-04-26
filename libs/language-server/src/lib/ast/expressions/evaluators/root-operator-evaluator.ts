// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationContext } from '../../../validation/validation-context';
import { BinaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import {
  DefaultBinaryOperatorEvaluator,
  NUMBER_TYPEGUARD,
} from '../operator-evaluator';

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
  ): number | undefined {
    const resultingValue = leftValue ** (1 / rightValue);

    if (!isFinite(resultingValue)) {
      if (leftValue === 0 && rightValue < 0) {
        context?.accept(
          'error',
          'Arithmetic error: root of zero with negative degree',
          { node: expression },
        );
      } else if (rightValue === 0) {
        context?.accept('error', 'Arithmetic error: root of degree zero', {
          node: expression,
        });
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
