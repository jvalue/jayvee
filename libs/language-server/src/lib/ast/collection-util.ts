import { AstNode } from 'langium';

import { AtomicValue, Collection, isCollection } from './generated/ast';
import { AstTypeGuard } from './model-util';

export function isTypedCollection<G extends AstTypeGuard<AtomicValue>>(
  collection: AstNode,
  collectionItemTypeGuard: G,
): collection is Collection {
  if (!isCollection(collection)) {
    return false;
  }

  return (
    validateTypedCollection(collection, collectionItemTypeGuard).invalidItems
      .length === 0
  );
}

export interface TypedCollectionValidation<T> {
  validItems: T[];
  invalidItems: AtomicValue[];
}

export function validateTypedCollection<T extends AtomicValue>(
  collection: Collection,
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
