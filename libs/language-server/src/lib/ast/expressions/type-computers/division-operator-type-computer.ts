// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PropertyValuetype } from '../../model-util';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer';

export class DivisionOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor() {
    super(PropertyValuetype.DECIMAL, PropertyValuetype.DECIMAL);
  }

  override doComputeType(): PropertyValuetype {
    return PropertyValuetype.DECIMAL;
  }
}
