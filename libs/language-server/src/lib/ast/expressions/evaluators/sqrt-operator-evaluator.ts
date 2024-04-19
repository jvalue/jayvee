// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { type ValidationContext } from '../../../validation/validation-context.js';
import { type UnaryExpression } from '../../generated/ast.js';
import { DefaultUnaryOperatorEvaluator } from '../operator-evaluator.js';
import { NUMBER_TYPEGUARD } from '../typeguards.js';

export class SqrtOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  number,
  number
> {
  constructor() {
    super('sqrt', NUMBER_TYPEGUARD);
  }
  override doEvaluate(
    operandValue: number,
    expression: UnaryExpression,
    context: ValidationContext | undefined,
  ): number | undefined {
    const resultingValue = Math.sqrt(operandValue);

    if (!isFinite(resultingValue)) {
      assert(operandValue < 0);
      context?.accept(
        'error',
        'Arithmetic error: square root of negative number',
        { node: expression },
      );
      return undefined;
    }
    return resultingValue;
  }
}
