// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type Valuetype } from '../../wrappers/value-type/index.js';
import { PrimitiveValuetypes } from '../../wrappers/value-type/primitive/primitive-valuetypes.js';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer.js';

export class BasicArithmeticOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor() {
    super(PrimitiveValuetypes.Decimal, PrimitiveValuetypes.Decimal);
  }

  override doComputeType(
    leftOperandType: Valuetype,
    rightOperandType: Valuetype,
  ): Valuetype {
    if (
      leftOperandType === PrimitiveValuetypes.Integer &&
      rightOperandType === PrimitiveValuetypes.Integer
    ) {
      return PrimitiveValuetypes.Integer;
    }
    return PrimitiveValuetypes.Decimal;
  }
}
