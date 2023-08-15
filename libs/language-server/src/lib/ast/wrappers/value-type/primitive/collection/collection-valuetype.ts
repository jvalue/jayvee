// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  type AtomicInternalValueRepresentation,
  type InternalValueRepresentation,
} from '../../../../expressions/internal-value-representation';
import { ValuetypeReference } from '../../../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { Valuetype, ValuetypeVisitor } from '../../valuetype';
import { createValuetype } from '../../valuetype-util';

import {
  AbstractCollectionValuetype,
  ToArray,
} from './abstract-collection-valuetype';

export class CollectionValuetype<
  I extends InternalValueRepresentation = InternalValueRepresentation,
> extends AbstractCollectionValuetype<I> {
  constructor(public readonly elementType: Valuetype<I>) {
    super();
  }

  override acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitCollection(this);
  }

  override getName(): string {
    return `Collection<${this.elementType.getName()}>`;
  }

  override equals(target: Valuetype): boolean {
    return (
      target instanceof CollectionValuetype &&
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

export function isCollectionValuetype<
  I extends AtomicInternalValueRepresentation,
>(v: unknown, elementType: Valuetype<I>): v is CollectionValuetype<I> {
  return v instanceof CollectionValuetype && v.elementType.equals(elementType);
}

export function createCollectionValuetype(
  collectionRef: ValuetypeReference,
): CollectionValuetype {
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
  const elementValuetype = createValuetype(generic.ref);
  if (elementValuetype === undefined) {
    throw new Error(
      "Could not create valuetype for the elements' type of valuetype Collection",
    );
  }
  return new CollectionValuetype(elementValuetype);
}
