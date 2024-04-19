// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

export * from './wrapper-factory-provider.js';
export * from './util/index.js';

/*
 * Note: Only export types if possible to enforce usage of WrapperFactory outside this directory.
 * This allows us to avoid dependency cycles between the language server and interpreter.
 */

export { type AstNodeWrapper } from './ast-node-wrapper.js';
export {
  type CellRangeWrapper,
  type CellWrapper,
  type ColumnWrapper,
  type RowWrapper,
} from './cell-range-wrapper.js';
export { type PipeWrapper } from './pipe-wrapper.js';
export { type PipelineWrapper } from './pipeline-wrapper.js';

export { type BlockTypeWrapper } from './typed-object/block-type-wrapper.js';
export { type CompositeBlockTypeWrapper } from './typed-object/composite-block-type-wrapper.js';
export { type ConstraintTypeWrapper } from './typed-object/constrainttype-wrapper.js';
export {
  ExampleDoc,
  PropertyDocs,
  PropertySpecification,
  type TypedObjectWrapper,
} from './typed-object/typed-object-wrapper.js';

export * from './value-type/index.js'; // type export handled one level deeper
