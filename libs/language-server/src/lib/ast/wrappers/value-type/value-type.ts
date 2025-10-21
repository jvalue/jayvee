// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
} from '../../expressions/internal-value-representation';

import { type AtomicValueType } from './atomic-value-type';
import {
  type BooleanValuetype,
  type CellRangeValuetype,
  type CollectionValueType,
  type ConstraintValuetype,
  type DecimalValuetype,
  type EmptyCollectionValueType,
  type IntegerValuetype,
  type RegexValuetype,
  type TextValuetype,
  type TransformValuetype,
  type ValuetypeAssignmentValuetype,
} from './primitive';

export interface VisitableValueType {
  acceptVisitor(visitor: ValueTypeVisitor): void;
}

export interface ValueType<
  I extends InternalValidValueRepresentation = InternalValidValueRepresentation,
> extends VisitableValueType {
  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R;

  /**
   * Primitive value types never contain types.
   * Atomic value types may contain one or more atomic or primitive value types.
   */
  getContainedTypes(): ValueType[] | undefined;

  /**
   * The convertible relation reflects the ability of primitive types to
   * convert into another primitive value type in a loss-less way (e.g., int to decimal).
   * Atomic value types have the same conversion behaviour as their contained type.
   */
  isConvertibleTo(target: ValueType): boolean;

  /**
   * Flag if value type can be referenced by users.
   * Examples:
   *   - Users can (not) reference a value type to extend it in a value type definition
   *   - Users can (not) reference a value type to parse values in the TableInterpreter block
   */
  isReferenceableByUser(): boolean;

  /**
   * Typeguard to validate whether a given value is in the correct internal representation of this value type.
   * For example, a TextValuetype has the internal representation string.
   */
  isInternalValidValueRepresentation(
    operandValue:
      | InternalValidValueRepresentation
      | InternalErrorValueRepresentation,
  ): operandValue is I;

  /**
   * Returns the index of the first contained type that is part of a type cycle
   */
  getIndexOfFirstPropertyInATypeCycle(
    visited?: ValueType[],
  ): number | undefined;

  isAllowedAsRuntimeParameter(): boolean;
  getName(): string;

  equals(target: ValueType): boolean;
}

export abstract class ValueTypeVisitor<R = unknown> {
  abstract visitBoolean(valueType: BooleanValuetype): R;
  abstract visitDecimal(valueType: DecimalValuetype): R;
  abstract visitInteger(valueType: IntegerValuetype): R;
  abstract visitText(valueType: TextValuetype): R;

  abstract visitCellRange(valueType: CellRangeValuetype): R;
  abstract visitRegex(valueType: RegexValuetype): R;
  abstract visitConstraint(valueType: ConstraintValuetype): R;
  abstract visitValuetypeAssignment(valueType: ValuetypeAssignmentValuetype): R;
  abstract visitCollection(
    valueType: CollectionValueType | EmptyCollectionValueType,
  ): R;
  abstract visitTransform(valueType: TransformValuetype): R;

  abstract visitAtomicValueType(valueType: AtomicValueType): R;
}
