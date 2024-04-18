// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/*
 * Note: Only export types if possible to enforce usage of WrapperFactory outside this directory.
 * This allows us to avoid dependency cycles between the language server and interpreter.
 */

export { type AstNodeWrapper } from './ast-node-wrapper';
export {
  type CellRangeWrapper,
  type CellWrapper,
  type ColumnWrapper,
  type RowWrapper,
} from './cell-range-wrapper';
export { type PipeWrapper } from './pipe-wrapper';
export { type PipelineWrapper } from './pipeline-wrapper';

export { type BlockTypeWrapper } from './typed-object/block-type-wrapper';
export { type CompositeBlockTypeWrapper } from './typed-object/composite-block-type-wrapper';
export { type ConstraintTypeWrapper } from './typed-object/constrainttype-wrapper';
export * from './typed-object/typed-object-wrapper';

export * from './value-type'; // type export handled one level deeper

export * from './util';
export * from './wrapper-factory-provider';
