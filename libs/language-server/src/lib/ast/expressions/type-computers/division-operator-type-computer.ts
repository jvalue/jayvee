// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValueType } from '../../wrappers/value-type';
// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetypes } from '../../wrappers/value-type/primitive/primitive-value-types';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer';

export class DivisionOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor() {
    super(PrimitiveValuetypes.Decimal, PrimitiveValuetypes.Decimal);
  }

  override doComputeType(): ValueType {
    return PrimitiveValuetypes.Decimal;
  }
}
