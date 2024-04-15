// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { DefaultUnaryOperatorEvaluator } from '../operator-evaluator';
import { BOOLEAN_TYPEGUARD } from '../typeguards';

export class NotOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  boolean,
  boolean
> {
  constructor() {
    super('not', BOOLEAN_TYPEGUARD);
  }
  override doEvaluate(operandValue: boolean): boolean {
    return !operandValue;
  }
}
