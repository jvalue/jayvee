// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValueType } from '../../wrappers/value-type';
import { PrimitiveValuetypes } from '../../wrappers/value-type/primitive/primitive-value-types';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer';

export class ExponentialOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor() {
    super(PrimitiveValuetypes.Decimal, PrimitiveValuetypes.Decimal);
  }

  protected override doComputeType(): ValueType {
    return PrimitiveValuetypes.Decimal;
  }
}
