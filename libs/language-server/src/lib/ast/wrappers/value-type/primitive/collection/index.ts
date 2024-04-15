// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/* Note: Only export types if possible to enforce usage of WrapperFactory outside this directory */

export {
  CollectionValueType as CollectionValuetype, // TODO: handle creation of collections to preserve internal typing
  isCollectionValueType as isCollectionValuetype,
} from './collection-value-type';

export {
  type EmptyCollectionValueType as EmptyCollectionValuetype,
  EmptyCollection,
  isEmptyCollectionValueType as isEmptyCollectionValuetype,
} from './empty-collection-value-type';
