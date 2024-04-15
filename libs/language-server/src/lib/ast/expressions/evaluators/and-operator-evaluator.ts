// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BooleanShortCircuitOperatorEvaluator } from '../operator-evaluator';

export class AndOperatorEvaluator extends BooleanShortCircuitOperatorEvaluator {
  constructor() {
    super('and');
  }
  override canSkipRightOperandEvaluation(leftValue: boolean): boolean {
    return leftValue === false;
  }

  override getShortCircuitValue(): boolean {
    return false;
  }

  override doEvaluate(leftValue: boolean, rightValue: boolean): boolean {
    return leftValue && rightValue;
  }
}
