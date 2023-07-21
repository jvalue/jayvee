// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../../expressions/internal-value-representation';
import { type Valuetype, type ValuetypeVisitor } from '../../valuetype';

// eslint-disable-next-line import/no-cycle
import { AbstractCollectionValuetype } from './abstract-collection-valuetype';
import { CollectionValuetype } from './collection-valuetype';

class EmptyCollectionValuetypeImpl extends AbstractCollectionValuetype<undefined> {
  override isConvertibleTo(target: Valuetype): boolean {
    return (
      super.isConvertibleTo(target) || target instanceof CollectionValuetype
    );
  }

  override acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitCollection(this);
  }

  override getName(): string {
    return `collection<>`;
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is [] {
    return Array.isArray(operandValue) && operandValue.length === 0;
  }
}

// Only export instance to enforce singleton
export const EmptyCollection = new EmptyCollectionValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type EmptyCollectionValuetype = InstanceType<
  typeof EmptyCollectionValuetypeImpl
>;

export function isEmptyCollectionValuetype(
  v: unknown,
): v is EmptyCollectionValuetype {
  return v === EmptyCollection;
}
