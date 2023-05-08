// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { Valuetype } from '../valuetype';

import { Integer } from './integer-valuetype';
import { PrimitiveValuetype } from './primitive-valuetype';

class DecimalValuetype extends PrimitiveValuetype {
  override isConvertibleTo(target: Valuetype): boolean {
    return target === this || target === Integer;
  }
}

export const Decimal = new DecimalValuetype();
