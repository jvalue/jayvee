// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AtomicInternalValidValueRepresentation,
  type InternalValidValueRepresentation,
} from '../../../../expressions/internal-value-representation';
import { type ValueType, type ValueTypeVisitor } from '../../value-type';

import {
  AbstractCollectionValueType,
  type ToArray,
} from './abstract-collection-value-type';

export class CollectionValueType<
  I extends InternalValidValueRepresentation = InternalValidValueRepresentation,
> extends AbstractCollectionValueType<I> {
  constructor(public readonly elementType: ValueType<I>) {
    super();
  }

  override acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitCollection(this);
  }

  override getName(): string {
    return `Collection<${this.elementType.getName()}>`;
  }

  override equals(target: ValueType): boolean {
    return (
      target instanceof CollectionValueType &&
      target.elementType.equals(this.elementType)
    );
  }

  override isInternalValidValueRepresentation(
    operandValue: InternalValidValueRepresentation,
  ): operandValue is ToArray<I> {
    return (
      Array.isArray(operandValue) &&
      operandValue.every((element) =>
        this.elementType.isInternalValidValueRepresentation(element),
      )
    );
  }
}

export function isCollectionValueType<
  I extends AtomicInternalValidValueRepresentation,
>(v: unknown, elementType: ValueType<I>): v is CollectionValueType<I> {
  return v instanceof CollectionValueType && v.elementType.equals(elementType);
}
