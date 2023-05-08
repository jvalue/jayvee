// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { Valuetype } from '../valuetype';

import { IntegerValuetype } from './integer-valuetype';
import { PrimitiveValuetype } from './primitive-valuetype';

export class DecimalValuetype extends PrimitiveValuetype {
  override isConvertibleTo(target: Valuetype): boolean {
    return (
      target instanceof DecimalValuetype || target instanceof IntegerValuetype
    );
  }
}
