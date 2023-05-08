// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PropertyValuetype } from '../../model-util';
import { DefaultUnaryOperatorTypeComputer } from '../operator-type-computer';

export class NotOperatorTypeComputer extends DefaultUnaryOperatorTypeComputer {
  constructor() {
    super(PropertyValuetype.BOOLEAN);
  }

  override doComputeType(): PropertyValuetype {
    return PropertyValuetype.BOOLEAN;
  }
}
