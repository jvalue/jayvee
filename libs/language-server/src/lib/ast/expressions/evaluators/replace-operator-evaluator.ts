// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { DefaultTernaryOperatorEvaluator } from '../operator-evaluator';
import { REGEXP_TYPEGUARD, STRING_TYPEGUARD } from '../typeguards';

export class ReplaceOperatorEvaluator extends DefaultTernaryOperatorEvaluator<
  string,
  RegExp,
  string,
  string
> {
  constructor() {
    super('replace', STRING_TYPEGUARD, REGEXP_TYPEGUARD, STRING_TYPEGUARD);
  }
  override doEvaluate(
    firstValue: string,
    secondValue: RegExp,
    thirdValue: string,
  ): string {
    return firstValue.replace(secondValue, thirdValue);
  }
}
