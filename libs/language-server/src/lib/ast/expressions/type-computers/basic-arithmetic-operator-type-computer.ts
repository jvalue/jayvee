// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type Valuetype } from '../../wrappers/value-type';
// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetypes } from '../../wrappers/value-type/primitive/primitive-valuetypes';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer';

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
