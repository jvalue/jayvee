// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { OperandValue } from '../evaluation';
import { DefaultBinaryOperatorEvaluator } from '../operator-evaluator';
import { OPERAND_VALUE_TYPEGUARD } from '../typeguards';

export class EqualityOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  OperandValue,
  OperandValue,
  boolean
> {
  constructor() {
    super('==', OPERAND_VALUE_TYPEGUARD, OPERAND_VALUE_TYPEGUARD);
  }
  override doEvaluate(left: OperandValue, right: OperandValue): boolean {
    return left === right;
  }
}
