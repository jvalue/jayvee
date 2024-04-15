// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValueType } from '../../wrappers/value-type';
// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetypes } from '../../wrappers/value-type/primitive/primitive-value-types';
import { DefaultUnaryOperatorTypeComputer } from '../operator-type-computer';

export class SqrtOperatorTypeComputer extends DefaultUnaryOperatorTypeComputer {
  constructor() {
    super(PrimitiveValuetypes.Decimal);
  }

  override doComputeType(): ValueType {
    return PrimitiveValuetypes.Decimal;
  }
}
