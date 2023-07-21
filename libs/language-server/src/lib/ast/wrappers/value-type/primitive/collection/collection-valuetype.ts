// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AtomicInternalValueRepresentation,
  type InternalValueRepresentation,
} from '../../../../expressions/internal-value-representation';
// eslint-disable-next-line import/no-cycle
import { Valuetype, ValuetypeVisitor } from '../../valuetype';

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
    return `collection<${this.elementType.getName()}>`;
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
