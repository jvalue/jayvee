// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import {
  BOOLEAN_TYPEGUARD,
  DefaultBinaryOperatorEvaluator,
} from '../operator-evaluator';

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
