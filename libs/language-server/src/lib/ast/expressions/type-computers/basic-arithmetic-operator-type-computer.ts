// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type ValueType,
  type ValueTypeProvider,
} from '../../wrappers/value-type';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer';

export class BasicArithmeticOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {
    super(
      valueTypeProvider.Primitives.Decimal,
      valueTypeProvider.Primitives.Decimal,
    );
  }

  override doComputeType(
    leftOperandType: ValueType,
    rightOperandType: ValueType,
  ): ValueType {
    if (
      leftOperandType === this.valueTypeProvider.Primitives.Integer &&
      rightOperandType === this.valueTypeProvider.Primitives.Integer
    ) {
      return this.valueTypeProvider.Primitives.Integer;
    }
    return this.valueTypeProvider.Primitives.Decimal;
  }
}
