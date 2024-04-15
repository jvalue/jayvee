// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  type AtomicInternalValueRepresentation,
  type InternalValueRepresentation,
} from '../../../../expressions/internal-value-representation';
import { type ValueTypeReference } from '../../../../generated/ast';
import { type ValueType, type ValueTypeVisitor } from '../../value-type';
// eslint-disable-next-line import/no-cycle
import { createValueType } from '../../value-type-util';

import {
  AbstractCollectionValueType,
  type ToArray,
} from './abstract-collection-value-type';

export class CollectionValueType<
  I extends InternalValueRepresentation = InternalValueRepresentation,
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

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is ToArray<I> {
    return (
      Array.isArray(operandValue) &&
      operandValue.every((element) =>
        this.elementType.isInternalValueRepresentation(element),
      )
    );
  }
}

export function isCollectionValueType<
  I extends AtomicInternalValueRepresentation,
>(v: unknown, elementType: ValueType<I>): v is CollectionValueType<I> {
  return v instanceof CollectionValueType && v.elementType.equals(elementType);
}

export function createCollectionValueType(
  collectionRef: ValueTypeReference,
): CollectionValueType {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const collectionDefinition = collectionRef?.reference?.ref;
  assert(collectionDefinition?.name === 'Collection');
  const collectionGenerics = collectionRef.genericRefs;
  if (collectionGenerics.length !== 1) {
    throw new Error(
      "Valuetype Collection needs exactly one generic parameter to define its elements' type",
    );
  }
  const generic = collectionGenerics[0];
  assert(generic !== undefined);
  const elementValuetype = createValueType(generic.ref);
  if (elementValuetype === undefined) {
    throw new Error(
      "Could not create value type for the elements' type of value type Collection",
    );
  }
  return new CollectionValueType(elementValuetype);
}
