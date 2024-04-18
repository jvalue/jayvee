// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../expressions';

import { type ValueType, type ValueTypeVisitor } from './value-type';

export abstract class AbstractValueType<I extends InternalValueRepresentation>
  implements ValueType<I>
{
  abstract acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R;

  isSubtypeOf(other: ValueType): boolean {
    let othersSupertype = other.getSupertype();
    while (othersSupertype !== undefined) {
      if (othersSupertype === this) {
        return true;
      }
      othersSupertype = othersSupertype.getSupertype();
    }
    return false;
  }

  getSupertype(): ValueType | undefined {
    if (this.hasSupertypeCycle()) {
      return undefined;
    }
    return this.doGetSupertype();
  }

  protected abstract doGetSupertype(): ValueType | undefined;

  abstract equals(target: ValueType): boolean;

  abstract isAllowedAsRuntimeParameter(): boolean;

  abstract isConvertibleTo(target: ValueType): boolean;

  isReferenceableByUser(): boolean {
    return false;
  }

  abstract isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is I;

  abstract getName(): string;

  hasSupertypeCycle(visited: ValueType[] = []): boolean {
    const cycleDetected = visited.some((v) => v.equals(this));
    if (cycleDetected) {
      return true;
    }
    visited.push(this);

    const supertype = this.doGetSupertype();
    if (supertype === undefined) {
      return false;
    }

    return supertype.hasSupertypeCycle(visited);
  }
}
