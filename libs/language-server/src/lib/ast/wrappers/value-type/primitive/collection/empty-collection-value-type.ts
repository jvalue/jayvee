// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../../expressions/internal-value-representation.js';
import { type ValueType, type ValueTypeVisitor } from '../../value-type.js';

import { AbstractCollectionValueType } from './abstract-collection-value-type.js';
import { CollectionValueType } from './collection-value-type.js';

export class EmptyCollectionValueType extends AbstractCollectionValueType<undefined> {
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
