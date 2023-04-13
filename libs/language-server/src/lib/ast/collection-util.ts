// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AtomicLiteral, CollectionLiteral } from './generated/ast';
import { PropertyValuetype, inferTypesFromValue } from './model-util';

export interface TypedCollectionValidation {
  validItems: AtomicLiteral[];
  invalidItems: AtomicLiteral[];
}

export function validateTypedCollection(
  collection: CollectionLiteral,
  desiredType: PropertyValuetype,
): TypedCollectionValidation {
  const validItems = collection.values.filter((i) =>
    inferTypesFromValue(i).includes(desiredType),
  );
  const invalidItems = collection.values.filter((i) => !validItems.includes(i));

  return {
    validItems,
    invalidItems,
  };
}
