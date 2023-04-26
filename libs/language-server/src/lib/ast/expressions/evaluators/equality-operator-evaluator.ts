// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import {
  DefaultBinaryOperatorEvaluator,
  OPERAND_VALUE_TYPEGUARD,
  OperandValue,
} from '../operator-evaluator';

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
