// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assertUnreachable } from 'langium';

import {
  type ValueTypeReference,
  type ValuetypeDefinition,
  isValueTypeReference,
  isValuetypeDefinition,
} from '../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { AtomicValueType } from './atomic-value-type';
// eslint-disable-next-line import/no-cycle
import { createPrimitiveValuetype } from './primitive';
import { createCollectionValueType } from './primitive/collection/collection-value-type';
import { type ValueType } from './value-type';

/**
 * Returns the matching value type instance for a given value type keyword or definition.
 * @returns the desired value type instance or undefined in case of incomplete AST nodes or a cycle in the hierarchy.
 */
export function createValueType(
  identifier: ValuetypeDefinition | ValueTypeReference | undefined,
): ValueType | undefined {
  if (identifier === undefined) {
    return undefined;
  } else if (isValueTypeReference(identifier)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const valueTypeDefinition = identifier?.reference?.ref;
    if (valueTypeDefinition?.name === 'Collection') {
      return createCollectionValueType(identifier);
    }
    return createValueType(valueTypeDefinition);
  } else if (isValuetypeDefinition(identifier)) {
    if (identifier.name === 'Collection') {
      // We don't have an object representing a generic collection
      return;
    }
    if (identifier.isBuiltin) {
      return createPrimitiveValuetype(identifier);
    }
    return new AtomicValueType(identifier);
  }
  assertUnreachable(identifier);
}
