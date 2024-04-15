// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { DefaultBinaryOperatorEvaluator } from '../operator-evaluator';
import { REGEXP_TYPEGUARD, STRING_TYPEGUARD } from '../typeguards';

export class MatchesOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  string,
  RegExp,
  boolean
> {
  constructor() {
    super('matches', STRING_TYPEGUARD, REGEXP_TYPEGUARD);
  }
  override doEvaluate(leftValue: string, rightValue: RegExp): boolean {
    return rightValue.test(leftValue);
  }
}
