// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../../expressions/internal-value-representation';
import { type ValueType, type ValueTypeVisitor } from '../../value-type';

import { AbstractCollectionValueType } from './abstract-collection-value-type';
// eslint-disable-next-line import/no-cycle
import { CollectionValueType } from './collection-value-type';

class EmptyCollectionValueTypeImpl extends AbstractCollectionValueType<undefined> {
  override isConvertibleTo(target: ValueType): boolean {
    return (
      super.isConvertibleTo(target) || target instanceof CollectionValueType
    );
  }

  override acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitCollection(this);
  }

  override getName(): string {
    return `Collection`;
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is [] {
    return Array.isArray(operandValue) && operandValue.length === 0;
  }
}

// Only export instance to enforce singleton
export const EmptyCollection = new EmptyCollectionValueTypeImpl();

// Only export type to allow narrowing down in visitors
export type EmptyCollectionValueType = InstanceType<
  typeof EmptyCollectionValueTypeImpl
>;

export function isEmptyCollectionValueType(
  v: unknown,
): v is EmptyCollectionValueType {
  return v === EmptyCollection;
}
