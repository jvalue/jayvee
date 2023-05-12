// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { InternalValueRepresentation } from '../evaluation';
import { DefaultBinaryOperatorEvaluator } from '../operator-evaluator';
import { OPERAND_VALUE_TYPEGUARD } from '../typeguards';

export class EqualityOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  InternalValueRepresentation,
  InternalValueRepresentation,
  boolean
> {
  constructor() {
    super('==', OPERAND_VALUE_TYPEGUARD, OPERAND_VALUE_TYPEGUARD);
  }
  override doEvaluate(left: InternalValueRepresentation, right: InternalValueRepresentation): boolean {
    return left === right;
  }
}
