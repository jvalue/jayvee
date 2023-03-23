// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode } from 'langium';

import {
  AtomicLiteral,
  CollectionLiteral,
  isCollectionLiteral,
} from './generated/ast';
import { AstTypeGuard } from './model-util';

export function isTypedCollection<G extends AstTypeGuard<AtomicLiteral>>(
  collection: AstNode,
  collectionItemTypeGuard: G,
): collection is CollectionLiteral {
  if (!isCollectionLiteral(collection)) {
    return false;
  }

  return (
    validateTypedCollection(collection, collectionItemTypeGuard).invalidItems
      .length === 0
  );
}

export interface TypedCollectionValidation<T> {
  validItems: T[];
  invalidItems: AtomicLiteral[];
}

export function validateTypedCollection<T extends AtomicLiteral>(
  collection: CollectionLiteral,
  collectionItemTypeGuard: AstTypeGuard<T>,
): TypedCollectionValidation<T> {
  const validItems: T[] = collection.values.filter(collectionItemTypeGuard);
  const invalidItems = collection.values.filter(
    (item) => !collectionItemTypeGuard(item),
  );

  return {
    validItems: validItems,
    invalidItems: invalidItems,
  };
}
