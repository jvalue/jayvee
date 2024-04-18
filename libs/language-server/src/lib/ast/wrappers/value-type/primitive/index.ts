// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/*
 * Note: Only export types if possible to enforce usage of WrapperFactory outside this directory.
 * This allows us to avoid dependency cycles between the language server and interpreter.
 */

export {
  isPrimitiveValueType,
  type PrimitiveValueType,
} from './primitive-value-type';

export { type BooleanValuetype } from './boolean-value-type';
export { type CellRangeValuetype } from './cell-range-value-type';
export { type ConstraintValuetype } from './constraint-value-type';
export { type DecimalValuetype } from './decimal-value-type';
export { type IntegerValuetype } from './integer-value-type';
export { type RegexValuetype } from './regex-value-type';
export { type TextValuetype } from './text-value-type';
export { type ValuetypeAssignmentValuetype } from './value-type-assignment-value-type';
export { type TransformValuetype } from './transform-value-type';

export {
  ValueTypeProvider,
  PrimitiveValueTypeProvider,
} from './primitive-value-type-provider';

export * from './collection'; // type export handled one level deeper
