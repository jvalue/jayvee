// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PropertyValuetype } from '../../model-util';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer';

export class LogicalOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor() {
    super(PropertyValuetype.BOOLEAN, PropertyValuetype.BOOLEAN);
  }

  protected override doComputeType(): PropertyValuetype {
    return PropertyValuetype.BOOLEAN;
  }
}
