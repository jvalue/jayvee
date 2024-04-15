// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import type { ValuetypeDefinition } from '../../../generated/ast';

import type { BooleanValuetype } from './boolean-value-type';
import { Boolean } from './boolean-value-type';
import type { CellRangeValuetype } from './cell-range-value-type';
import { CellRange } from './cell-range-value-type';
import type { ConstraintValuetype } from './constraint-value-type';
import { Constraint } from './constraint-value-type';
import type { DecimalValuetype } from './decimal-value-type';
import { Decimal } from './decimal-value-type';
import type { IntegerValuetype } from './integer-value-type';
import { Integer } from './integer-value-type';
import type { PrimitiveValueType } from './primitive-value-type';
import type { RegexValuetype } from './regex-value-type';
import { Regex } from './regex-value-type';
import type { TextValuetype } from './text-value-type';
import { Text } from './text-value-type';
import type { TransformValuetype } from './transform-value-type';
import { Transform } from './transform-value-type';
import type { ValuetypeAssignmentValuetype } from './value-type-assignment-value-type';
import { ValuetypeAssignment } from './value-type-assignment-value-type';

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
