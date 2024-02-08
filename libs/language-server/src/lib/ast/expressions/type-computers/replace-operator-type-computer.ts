// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type Valuetype } from '../../wrappers/value-type';
// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetypes } from '../../wrappers/value-type/primitive/primitive-valuetypes';
import { DefaultTernaryOperatorTypeComputer } from '../operator-type-computer';

export class ReplaceOperatorTypeComputer extends DefaultTernaryOperatorTypeComputer {
  constructor() {
    super(
      PrimitiveValuetypes.Text,
      PrimitiveValuetypes.Regex,
      PrimitiveValuetypes.Text,
    );
  }

  override doComputeType(): Valuetype {
    return PrimitiveValuetypes.Text;
  }
}
