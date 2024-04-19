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
} from './primitive-value-type.js';

export { type BooleanValuetype } from './boolean-value-type.js';
export { type CellRangeValuetype } from './cell-range-value-type.js';
export { type ConstraintValuetype } from './constraint-value-type.js';
export { type DecimalValuetype } from './decimal-value-type.js';
export { type IntegerValuetype } from './integer-value-type.js';
export { type RegexValuetype } from './regex-value-type.js';
export { type TextValuetype } from './text-value-type.js';
export { type ValuetypeAssignmentValuetype } from './value-type-assignment-value-type.js';
export { type TransformValuetype } from './transform-value-type.js';

export {
  ValueTypeProvider,
  PrimitiveValueTypeProvider,
} from './primitive-value-type-provider.js';

export * from './collection/index.js'; // type export handled one level deeper
