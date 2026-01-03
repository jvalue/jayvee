// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValidValueRepresentation } from '../../../expressions';
import { type ValueType } from '../value-type';

import { BooleanValuetype } from './boolean-value-type';
import { CellRangeValuetype } from './cell-range-value-type';
import { CollectionValueType } from './collection/collection-value-type';
import { EmptyCollectionValueType } from './collection/empty-collection-value-type';
import { ConstraintValuetype } from './constraint-value-type';
import { DecimalValuetype } from './decimal-value-type';
import { IntegerValuetype } from './integer-value-type';
import { type PrimitiveValueType } from './primitive-value-type';
import { RegexValuetype } from './regex-value-type';
import { TextValuetype } from './text-value-type';
import { TransformValuetype } from './transform-value-type';
import { ValuetypeAssignmentValuetype } from './value-type-assignment-value-type';
import { ValuetypeDefinitionValuetype } from './value-type-definition-value-type';
import { TableRowValueType } from './table-row-value-type';

/**
 * Should be created as singleton due to the equality comparison of primitive value types.
 * Exported for testing purposes.
 */
export class ValueTypeProvider {
  Primitives = new PrimitiveValueTypeProvider();
  EmptyCollection = new EmptyCollectionValueType();

  createCollectionValueTypeOf<I extends InternalValidValueRepresentation>(
    input: ValueType<I>,
  ): CollectionValueType<I> {
    return new CollectionValueType(input);
  }

  createTableRowValueTypeOf(input: Map<string, ValueType>): TableRowValueType {
    return new TableRowValueType(input);
  }
}

export class PrimitiveValueTypeProvider {
  Decimal = new DecimalValuetype();
  Boolean = new BooleanValuetype();
  Integer = new IntegerValuetype();
  Text = new TextValuetype();

  Regex = new RegexValuetype();
  CellRange = new CellRangeValuetype();
  Constraint = new ConstraintValuetype();
  ValuetypeAssignment = new ValuetypeAssignmentValuetype();
  ValuetypeDefinition = new ValuetypeDefinitionValuetype();

  Transform = new TransformValuetype();

  getAll(): PrimitiveValueType[] {
    return [
      this.Boolean,
      this.Decimal,
      this.Integer,
      this.Text,
      this.Regex,
      this.CellRange,
      this.Constraint,
      this.ValuetypeAssignment,
      this.ValuetypeDefinition,
      this.Transform,
    ];
  }
}
