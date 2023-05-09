// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { Boolean } from './boolean-valuetype';
import { CellRange } from './cell-range-valuetype';
import { Collection } from './collection-valuetype';
import { Constraint } from './constraint-valuetype';
import { Decimal } from './decimal-valuetype';
import { Integer } from './integer-valuetype';
import { PrimitiveValuetype } from './primitive-valuetype';
import { Regex } from './regex-valuetype';
import { Text } from './text-valuetype';
import { ValuetypeAssignment } from './valuetype-assignment-valuetype';

export * from './primitive-valuetype';
export const PrimitiveValuetypes: {
  Boolean: PrimitiveValuetype;
  Decimal: PrimitiveValuetype;
  Integer: PrimitiveValuetype;
  Text: PrimitiveValuetype;
  Regex: PrimitiveValuetype;
  CellRange: PrimitiveValuetype;
  Constraint: PrimitiveValuetype;
  ValuetypeAssignment: PrimitiveValuetype;
  Collection: PrimitiveValuetype;
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
