// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValueType } from '../../wrappers/value-type';
import { PrimitiveValuetypes } from '../../wrappers/value-type/primitive/primitive-value-types';
import { DefaultUnaryOperatorTypeComputer } from '../operator-type-computer';

export class StringTransformTypeComputer extends DefaultUnaryOperatorTypeComputer {
  constructor() {
    super(PrimitiveValuetypes.Text);
  }

  override doComputeType(): ValueType {
    return PrimitiveValuetypes.Text;
  }
}
