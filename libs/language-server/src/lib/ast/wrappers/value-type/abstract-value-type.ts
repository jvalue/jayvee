// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
} from '../../expressions';

import { type ValueType, type ValueTypeVisitor } from './value-type';

export abstract class AbstractValueType<
  I extends InternalValidValueRepresentation,
> implements ValueType<I>
{
  abstract acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R;

  getContainedTypes(): ValueType[] | undefined {
    if (this.typeCycleIndex() !== undefined) {
      return undefined;
    }
    return this.doGetContainedTypes();
  }

  protected abstract doGetContainedTypes(): ValueType[];

  abstract equals(target: ValueType): boolean;

  abstract isAllowedAsRuntimeParameter(): boolean;

  abstract isConvertibleTo(target: ValueType): boolean;

  isReferenceableByUser(): boolean {
    return false;
  }

  abstract isInternalValidValueRepresentation(
    operandValue:
      | InternalValidValueRepresentation
      | InternalErrorValueRepresentation,
  ): operandValue is I;

  abstract getName(): string;

  typeCycleIndex(visited: ValueType[] = []): number | undefined {
    const cycleDetected = visited.some((v) => v.equals(this));
    if (cycleDetected) {
      return -1;
    }
    visited.push(this);

    const idx = this.doGetContainedTypes().findIndex(
      (containedType) => containedType.typeCycleIndex(visited) !== undefined,
    );
    return idx !== -1 ? idx : undefined;
  }
}
