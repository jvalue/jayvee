// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/index.js';
import { type ValueType } from '../value-type.js';

import { BooleanValuetype } from './boolean-value-type.js';
import { CellRangeValuetype } from './cell-range-value-type.js';
import { CollectionValueType } from './collection/collection-value-type.js';
import { EmptyCollectionValueType } from './collection/empty-collection-value-type.js';
import { ConstraintValuetype } from './constraint-value-type.js';
import { DecimalValuetype } from './decimal-value-type.js';
import { IntegerValuetype } from './integer-value-type.js';
import { type PrimitiveValueType } from './primitive-value-type.js';
import { RegexValuetype } from './regex-value-type.js';
import { TextValuetype } from './text-value-type.js';
import { TransformValuetype } from './transform-value-type.js';
import { ValuetypeAssignmentValuetype } from './value-type-assignment-value-type.js';

/**
 * Should be created as singleton due to the equality comparison of primitive value types.
 * Exported for testing purposes.
 */
export class ValueTypeProvider {
  Primitives = new PrimitiveValueTypeProvider();
  EmptyCollection = new EmptyCollectionValueType();

  createCollectionValueTypeOf<I extends InternalValueRepresentation>(
    input: ValueType<I>,
  ): CollectionValueType<I> {
    return new CollectionValueType(input);
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
      this.Transform,
    ];
  }
}
