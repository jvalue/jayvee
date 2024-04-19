// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { DefaultBinaryOperatorEvaluator } from '../operator-evaluator.js';
import { BOOLEAN_TYPEGUARD } from '../typeguards.js';

export class XorOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  boolean,
  boolean,
  boolean
> {
  constructor() {
    super('xor', BOOLEAN_TYPEGUARD, BOOLEAN_TYPEGUARD);
  }
  override doEvaluate(leftValue: boolean, rightValue: boolean): boolean {
    return (leftValue && !rightValue) || (!leftValue && rightValue);
  }
}
