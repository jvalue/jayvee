// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import {
  DefaultBinaryOperatorEvaluator,
  NUMBER_TYPEGUARD,
} from '../operator-evaluator';

export class LessThanOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  number,
  number,
  boolean
> {
  constructor() {
    super('<', NUMBER_TYPEGUARD, NUMBER_TYPEGUARD);
  }
  override doEvaluate(leftValue: number, rightValue: number): boolean {
    return leftValue < rightValue;
  }
}
