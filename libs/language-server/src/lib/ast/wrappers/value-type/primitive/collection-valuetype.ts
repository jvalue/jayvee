// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { Valuetype, ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class CollectionValuetypeImpl extends PrimitiveValuetype {
  override isConvertibleTo(target: Valuetype): boolean {
    return target === this;
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitCollection(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'collection' {
    return 'collection';
  }
}

// Only export instance to enforce singleton
export const Collection = new CollectionValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type CollectionValuetype = InstanceType<typeof CollectionValuetypeImpl>;

export function isCollectionValuetype(v: unknown): v is CollectionValuetype {
  return v === Collection;
}
