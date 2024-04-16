// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type PrimitiveValueTypeProvider,
  type ValueType,
} from '../../wrappers/value-type';
import { DefaultUnaryOperatorTypeComputer } from '../operator-type-computer';

export class SignOperatorTypeComputer extends DefaultUnaryOperatorTypeComputer {
  constructor(
    protected readonly valueTypesProvider: PrimitiveValueTypeProvider,
  ) {
    super(valueTypesProvider.Primitives.Decimal);
  }

  override doComputeType(operandType: ValueType): ValueType {
    return operandType;
  }
}
