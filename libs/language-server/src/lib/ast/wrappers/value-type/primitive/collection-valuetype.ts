// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/evaluation';
import { CollectionLiteral, isCollectionLiteral } from '../../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class CollectionValuetypeImpl extends PrimitiveValuetype<CollectionLiteral> {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitCollection(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'collection' {
    return 'collection';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation,
  ): operandValue is CollectionLiteral {
    return isCollectionLiteral(operandValue);
  }
}

// Only export instance to enforce singleton
export const Collection = new CollectionValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type CollectionValuetype = InstanceType<typeof CollectionValuetypeImpl>;

export function isCollectionValuetype(v: unknown): v is CollectionValuetype {
  return v === Collection;
}
