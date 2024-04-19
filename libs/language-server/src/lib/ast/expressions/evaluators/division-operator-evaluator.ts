// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { type ValidationContext } from '../../../validation/validation-context.js';
import { type BinaryExpression } from '../../generated/ast.js';
import { DefaultBinaryOperatorEvaluator } from '../operator-evaluator.js';
import { NUMBER_TYPEGUARD } from '../typeguards.js';

export class DivisionOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  number,
  number,
  number
> {
  constructor() {
    super('/', NUMBER_TYPEGUARD, NUMBER_TYPEGUARD);
  }

  override doEvaluate(
    leftValue: number,
    rightValue: number,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): number | undefined {
    const resultingValue = leftValue / rightValue;

    if (!isFinite(resultingValue)) {
      assert(rightValue === 0);
      context?.accept('error', 'Arithmetic error: division by zero', {
        node: expression,
      });
      return undefined;
    }
    return resultingValue;
  }
}
