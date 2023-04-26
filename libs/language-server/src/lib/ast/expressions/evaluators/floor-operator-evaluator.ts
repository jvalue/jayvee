// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import {
  DefaultUnaryOperatorEvaluator,
  NUMBER_TYPEGUARD,
} from '../operator-evaluator';

export class FloorOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  number,
  number
> {
  constructor() {
    super('floor', NUMBER_TYPEGUARD);
  }
  override doEvaluate(operandValue: number): number {
    return Math.floor(operandValue);
  }
}
