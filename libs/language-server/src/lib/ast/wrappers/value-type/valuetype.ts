// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  PrimitiveValuetypeKeywordLiteral,
  ValuetypeDefinition,
} from '../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { AtomicValuetype } from './atomic-valuetype';
// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetype } from './primitive';

export type ValuetypeAstNode =
  | PrimitiveValuetypeKeywordLiteral
  | ValuetypeDefinition;

export interface VisitableValuetype {
  acceptVisitor(visitor: ValuetypeVisitor): void;
}

export interface Valuetype extends VisitableValuetype {
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
}

export abstract class AbstractValuetype implements Valuetype {
  constructor(protected readonly supertype?: Valuetype) {}

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
    return this.supertype;
  }

  abstract isConvertibleTo(target: Valuetype): boolean;
}

export abstract class ValuetypeVisitor<R = unknown> {
  abstract visitBoolean(valuetype: PrimitiveValuetype): R;
  abstract visitDecimal(valuetype: PrimitiveValuetype): R;
  abstract visitInteger(valuetype: PrimitiveValuetype): R;
  abstract visitText(valuetype: PrimitiveValuetype): R;

  abstract visitCellRange(valuetype: PrimitiveValuetype): R;
  abstract visitRegex(valuetype: PrimitiveValuetype): R;
  abstract visitConstraint(valuetype: PrimitiveValuetype): R;
  abstract visitValuetypeAssignment(valuetype: PrimitiveValuetype): R;
  abstract visitCollection(valuetype: PrimitiveValuetype): R;

  abstract visitAtomicValuetype(valuetype: AtomicValuetype): R;
}
