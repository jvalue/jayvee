// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { Boolean, BooleanValuetype } from './boolean-valuetype';
import { CellRange, CellRangeValuetype } from './cell-range-valuetype';
import { Collection, CollectionValuetype } from './collection-valuetype';
import { Constraint, ConstraintValuetype } from './constraint-valuetype';
import { Decimal, DecimalValuetype } from './decimal-valuetype';
import { Integer, IntegerValuetype } from './integer-valuetype';
import { Regex, RegexValuetype } from './regex-valuetype';
import { Text, TextValuetype } from './text-valuetype';
import {
  ValuetypeAssignment,
  ValuetypeAssignmentValuetype,
} from './valuetype-assignment-valuetype';

export const PrimitiveValuetypes: {
  Boolean: BooleanValuetype;
  Decimal: DecimalValuetype;
  Integer: IntegerValuetype;
  Text: TextValuetype;
  Regex: RegexValuetype;
  CellRange: CellRangeValuetype;
  Constraint: ConstraintValuetype;
  ValuetypeAssignment: ValuetypeAssignmentValuetype;
  Collection: CollectionValuetype;
} = {
  Boolean: Boolean,
  Decimal: Decimal,
  Integer: Integer,
  Text: Text,

  Regex: Regex,
  CellRange: CellRange,
  Constraint: Constraint,
  ValuetypeAssignment: ValuetypeAssignment,

  Collection: Collection,
};
