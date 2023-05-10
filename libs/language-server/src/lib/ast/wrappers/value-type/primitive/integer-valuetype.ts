// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PrimitiveValuetypeKeyword } from '../../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { Valuetype, ValuetypeVisitor } from '../valuetype';

import { Decimal } from './decimal-valuetype';
import { PrimitiveValuetype } from './primitive-valuetype';

class IntegerValuetypeImpl extends PrimitiveValuetype {
  override isConvertibleTo(target: Valuetype): boolean {
    return target === this || target === Decimal;
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitInteger(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return true;
  }

  override getName(): PrimitiveValuetypeKeyword {
    return 'integer';
  }
}

// Only export instance to enforce singleton
export const Integer = new IntegerValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type IntegerValuetype = InstanceType<typeof IntegerValuetypeImpl>;

export function isIntegerValuetype(v: unknown): v is IntegerValuetype {
  return v === Integer;
}
