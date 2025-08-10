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

  getContainedType(): ValueType | undefined {
    if (this.hasTypeCycle()) {
      return undefined;
    }
    return this.doGetContainedType();
  }

  protected abstract doGetContainedType(): ValueType | undefined;

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

  hasTypeCycle(visited: ValueType[] = []): boolean {
    const cycleDetected = visited.some((v) => v.equals(this));
    if (cycleDetected) {
      return true;
    }
    visited.push(this);

    const supertype = this.doGetContainedType();
    if (supertype === undefined) {
      return false;
    }

    return supertype.hasTypeCycle(visited);
  }
}
