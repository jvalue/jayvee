// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../expressions/evaluation';
import {
  PrimitiveValuetypeKeywordLiteral,
  ValuetypeDefinition,
} from '../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { AtomicValuetype } from './atomic-valuetype';
import {
  type BooleanValuetype,
  type CellRangeValuetype,
  type CollectionValuetype,
  type ConstraintValuetype,
  type DecimalValuetype,
  type IntegerValuetype,
  type RegexValuetype,
  type TextValuetype,
  type TransformValuetype,
  type ValuetypeAssignmentValuetype,
} from './primitive';

export type ValuetypeAstNode =
  | PrimitiveValuetypeKeywordLiteral
  | ValuetypeDefinition;

export interface VisitableValuetype {
  acceptVisitor(visitor: ValuetypeVisitor): void;
}

export interface Valuetype<
  I extends InternalValueRepresentation = InternalValueRepresentation,
> extends VisitableValuetype {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R;

  /**
   * The subtype relation reflects the hierarchy of value types.
   * Primitive value types are never a subtype of another value type.
   * Atomic value types may form a hierarchy below a primitive value type.
   */
  isSubtypeOf(other: Valuetype): boolean;

  /**
   * The supertype relation reflects the hierarchy of value types.
   * Primitive value types never have a supertype.
   * Atomic value types may have a atomic or primitive value type as supertype.
   */
  getSupertype(): Valuetype | undefined;

  /**
   * The convertible relation reflects the ability of primitive types to
   * convert into another primitive value type in a loss-less way (e.g., int to decimal).
   * Atomic value types inherit (@see isSubtypeOf) the conversion behavior of their primitive value type.
   */
  isConvertibleTo(target: Valuetype): boolean;

  /**
   * Typeguard to validate whether a given value is in the correct internal representation of this valuetype.
   * For example, a TextValuetype has the internal representation string.
   */
  isInternalValueRepresentation(
    operandValue: InternalValueRepresentation,
  ): operandValue is I;

  /**
   * Checks if there is a cycle in the supertype relation.
   */
  hasSupertypeCycle(visited?: Valuetype[]): boolean;

  isAllowedAsRuntimeParameter(): boolean;
  getName(): string;

  equals(target: Valuetype): boolean;
}

export abstract class AbstractValuetype<I extends InternalValueRepresentation>
  implements Valuetype<I>
{
  abstract acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R;

  isSubtypeOf(other: Valuetype): boolean {
    let othersSupertype = other.getSupertype();
    while (othersSupertype !== undefined) {
      if (othersSupertype === this) {
        return true;
      }
      othersSupertype = othersSupertype.getSupertype();
    }
    return false;
  }

  getSupertype(): Valuetype | undefined {
    if (this.hasSupertypeCycle()) {
      return undefined;
    }
    return this.doGetSupertype();
  }

  protected abstract doGetSupertype(): Valuetype | undefined;

  abstract equals(target: Valuetype): boolean;

  abstract isAllowedAsRuntimeParameter(): boolean;

  abstract isConvertibleTo(target: Valuetype): boolean;

  abstract isInternalValueRepresentation(
    operandValue: InternalValueRepresentation,
  ): operandValue is I;

  abstract getName(): string;

  hasSupertypeCycle(visited: Valuetype[] = []): boolean {
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

export abstract class ValuetypeVisitor<R = unknown> {
  abstract visitBoolean(valuetype: BooleanValuetype): R;
  abstract visitDecimal(valuetype: DecimalValuetype): R;
  abstract visitInteger(valuetype: IntegerValuetype): R;
  abstract visitText(valuetype: TextValuetype): R;

  abstract visitCellRange(valuetype: CellRangeValuetype): R;
  abstract visitRegex(valuetype: RegexValuetype): R;
  abstract visitConstraint(valuetype: ConstraintValuetype): R;
  abstract visitValuetypeAssignment(valuetype: ValuetypeAssignmentValuetype): R;
  abstract visitCollection(valuetype: CollectionValuetype): R;
  abstract visitTransform(valuetype: TransformValuetype): R;

  abstract visitAtomicValuetype(valuetype: AtomicValuetype): R;
}
