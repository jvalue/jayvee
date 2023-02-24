import { AstNode } from 'langium';

import { AtomicValue, Collection, isCollection } from './generated/ast';

type TypeGuard<T> = (obj: unknown) => obj is T;

export function isTypedCollection<T extends AtomicValue>(
  collection: AstNode,
  collectionItemTypeGuard: TypeGuard<T>,
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

export function validateTypedCollection<T>(
  collection: Collection,
  collectionItemTypeGuard: TypeGuard<T>,
): TypedCollectionValidation<T> {
  const validItems = collection.values.filter((item) =>
    collectionItemTypeGuard(item),
  );
  const invalidItems = collection.values.filter(
    (item) => !collectionItemTypeGuard(item),
  );

  return {
    validItems: validItems as T[],
    invalidItems: invalidItems,
  };
}
