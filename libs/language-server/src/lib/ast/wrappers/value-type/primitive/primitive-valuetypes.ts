// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValuetypeDefinition } from '../../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { Boolean, BooleanValuetype } from './boolean-valuetype';
import { CellRange, CellRangeValuetype } from './cell-range-valuetype';
import {
  EmptyCollection,
  EmptyCollectionValuetype,
} from './collection/empty-collection-valuetype';
import { Constraint, ConstraintValuetype } from './constraint-valuetype';
import { Decimal, DecimalValuetype } from './decimal-valuetype';
import { Integer, IntegerValuetype } from './integer-valuetype';
import { PrimitiveValuetype } from './primitive-valuetype';
import { Regex, RegexValuetype } from './regex-valuetype';
import { Text, TextValuetype } from './text-valuetype';
import { Transform, TransformValuetype } from './transform-valuetype';
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
  EmptyCollection: EmptyCollectionValuetype;
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

  EmptyCollection: EmptyCollection,
  Transform: Transform,
};

export const BuiltinValuetypesLib = {
  'builtin:///stdlib/builtin-valuetypes.jv': Object.values(PrimitiveValuetypes)
    .filter((v) => v.isUserExtendable())
    .map((valueType) => `builtin valuetype ${valueType.getName()};`)
    .join('\n'),
};

export function createPrimitiveValuetype(
  builtinValuetype: ValuetypeDefinition,
): PrimitiveValuetype | undefined {
  assert(builtinValuetype.isBuiltin);
  const name = builtinValuetype.name;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (name === undefined) {
    return undefined;
  }

  switch (name) {
    case 'boolean':
      return Boolean;
    case 'decimal':
      return Decimal;
    case 'integer':
      return Integer;
    case 'text':
      return Text;
    default:
      throw new Error(
        `Found no PrimitiveValuetype for builtin valuetype "${name}"`,
      );
  }
}
