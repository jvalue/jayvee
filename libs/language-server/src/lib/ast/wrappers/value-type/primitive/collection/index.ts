// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/*
 * Note: Only export types if possible to enforce usage of WrapperFactory outside this directory.
 * This allows us to avoid dependency cycles between the language server and interpreter.
 */

export {
  type CollectionValueType,
  isCollectionValueType,
} from './collection-value-type';
export { type EmptyCollectionValueType } from './empty-collection-value-type';
