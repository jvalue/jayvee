// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValuetypeDefinition } from '../../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { Boolean, BooleanValuetype } from './boolean-valuetype';
import { CellRange, CellRangeValuetype } from './cell-range-valuetype';
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

export function createPrimitiveValuetype(
  builtinValuetype: ValuetypeDefinition,
): PrimitiveValuetype | undefined {
  assert(builtinValuetype.isBuiltin);
  const name = builtinValuetype.name;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (name === undefined) {
    return undefined;
  }

  const matchingPrimitives = Object.values(PrimitiveValuetypes).filter(
    (valuetype) => valuetype.getName() === name,
  );
  if (matchingPrimitives.length === 0) {
    throw new Error(
      `Found no PrimitiveValuetype for builtin valuetype "${name}"`,
    );
  }
  if (matchingPrimitives.length > 1) {
    throw new Error(
      `Found multiple ambiguous PrimitiveValuetype for builtin valuetype "${name}"`,
    );
  }
  return matchingPrimitives[0];
}
