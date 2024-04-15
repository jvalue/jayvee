// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { DefaultUnaryOperatorEvaluator } from '../operator-evaluator';
import { STRING_TYPEGUARD } from '../typeguards';

export class LowercaseOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  string,
  string
> {
  constructor() {
    super('lowercase', STRING_TYPEGUARD);
  }
  override doEvaluate(operandValue: string): string {
    return operandValue.toLowerCase();
  }
}
