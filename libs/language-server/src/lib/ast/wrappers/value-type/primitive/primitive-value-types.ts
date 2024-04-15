// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValuetypeDefinition } from '../../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { Boolean, BooleanValuetype } from './boolean-value-type';
import { CellRange, CellRangeValuetype } from './cell-range-value-type';
import { Constraint, ConstraintValuetype } from './constraint-value-type';
import { Decimal, DecimalValuetype } from './decimal-value-type';
import { Integer, IntegerValuetype } from './integer-value-type';
import { PrimitiveValueType } from './primitive-value-type';
import { Regex, RegexValuetype } from './regex-value-type';
import { Text, TextValuetype } from './text-value-type';
import { Transform, TransformValuetype } from './transform-value-type';
import {
  ValuetypeAssignment,
  ValuetypeAssignmentValuetype,
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

export function createPrimitiveValuetype(
  builtinValuetype: ValuetypeDefinition,
): PrimitiveValueType | undefined {
  assert(builtinValuetype.isBuiltin);
  const name = builtinValuetype.name;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (name === undefined) {
    return undefined;
  }

  const matchingPrimitives = Object.values(PrimitiveValuetypes).filter(
    (valueType) => valueType.getName() === name,
  );
  if (matchingPrimitives.length === 0) {
    throw new Error(
      `Found no PrimitiveValuetype for builtin value type "${name}"`,
    );
  }
  if (matchingPrimitives.length > 1) {
    throw new Error(
      `Found multiple ambiguous PrimitiveValuetype for builtin value type "${name}"`,
    );
  }
  return matchingPrimitives[0];
}
