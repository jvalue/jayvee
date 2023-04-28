// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AtomicLiteral, CollectionLiteral } from './generated/ast';
import { PropertyValuetype, inferTypeFromValue } from './model-util';

export interface TypedCollectionValidation {
  validItems: AtomicLiteral[];
  invalidItems: AtomicLiteral[];
}

export function validateTypedCollection(
  collection: CollectionLiteral,
  desiredTypes: PropertyValuetype[],
): TypedCollectionValidation {
  const validItems = collection.values.filter((value) => {
    const valueType = inferTypeFromValue(value);
    return valueType !== undefined && desiredTypes.includes(valueType);
  });
  const invalidItems = collection.values.filter(
    (value) => !validItems.includes(value),
  );

  return {
    validItems,
    invalidItems,
  };
}
