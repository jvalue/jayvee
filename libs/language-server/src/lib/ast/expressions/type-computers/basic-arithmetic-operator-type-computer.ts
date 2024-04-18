// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type ValueType,
  type ValueTypeProvider,
} from '../../wrappers/value-type';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer';

export class BasicArithmeticOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor(protected readonly valueTypes: ValueTypeProvider) {
    super(valueTypes.Primitives.Decimal, valueTypes.Primitives.Decimal);
  }

  override doComputeType(
    leftOperandType: ValueType,
    rightOperandType: ValueType,
  ): ValueType {
    if (
      leftOperandType === this.valueTypes.Primitives.Integer &&
      rightOperandType === this.valueTypes.Primitives.Integer
    ) {
      return this.valueTypes.Primitives.Integer;
    }
    return this.valueTypes.Primitives.Decimal;
  }
}
