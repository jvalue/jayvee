// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { Boolean, type BooleanValuetype } from './boolean-value-type';
import { CellRange, type CellRangeValuetype } from './cell-range-value-type';
import { Constraint, type ConstraintValuetype } from './constraint-value-type';
import { Decimal, type DecimalValuetype } from './decimal-value-type';
import { Integer, type IntegerValuetype } from './integer-value-type';
import { Regex, type RegexValuetype } from './regex-value-type';
import { Text, type TextValuetype } from './text-value-type';
import { Transform, type TransformValuetype } from './transform-value-type';
import {
  ValuetypeAssignment,
  type ValuetypeAssignmentValuetype,
} from './value-type-assignment-value-type';

export const PrimitiveValuetypes: {
  Boolean: BooleanValuetype;
  Decimal: DecimalValuetype;
  Integer: IntegerValuetype;
  Text: TextValuetype;
  Regex: RegexValuetype;
  CellRange: CellRangeValuetype;
  Constraint: ConstraintValuetype;
  ValuetypeAssignment: ValuetypeAssignmentValuetype;
  Transform: TransformValuetype;
} = {
  Boolean: Boolean,
  Decimal: Decimal,
  Integer: Integer,
  Text: Text,

  Regex: Regex,
  CellRange: CellRange,
  Constraint: Constraint,
  ValuetypeAssignment: ValuetypeAssignment,

  Transform: Transform,
};
