// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { DefaultUnaryOperatorEvaluator } from '../operator-evaluator.js';
import { STRING_TYPEGUARD } from '../typeguards.js';

export class UppercaseOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  string,
  string
> {
  constructor() {
    super('uppercase', STRING_TYPEGUARD);
  }
  override doEvaluate(operandValue: string): string {
    return operandValue.toUpperCase();
  }
}
