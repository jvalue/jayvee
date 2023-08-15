// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assertUnreachable } from 'langium';

import {
  ValuetypeDefinition,
  ValuetypeReference,
  isValuetypeDefinition,
  isValuetypeReference,
} from '../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { AtomicValuetype } from './atomic-valuetype';
// eslint-disable-next-line import/no-cycle
import { createPrimitiveValuetype } from './primitive';
import { createCollectionValuetype } from './primitive/collection/collection-valuetype';
import { Valuetype } from './valuetype';

/**
 * Returns the matching valuetype instance for a given valuetype keyword or definition.
 * @returns the desired valuetype instance or undefined in case of incomplete AST nodes or a cycle in the hierarchy.
 */
export function createValuetype(
  identifier: ValuetypeDefinition | ValuetypeReference | undefined,
): Valuetype | undefined {
  if (identifier === undefined) {
    return undefined;
  } else if (isValuetypeReference(identifier)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const valuetypeDefinition = identifier?.reference?.ref;
    if (valuetypeDefinition?.name === 'Collection') {
      return createCollectionValuetype(identifier);
    }
    return createValuetype(valuetypeDefinition);
  } else if (isValuetypeDefinition(identifier)) {
    if (identifier.name === 'Collection') {
      // We don't have an object representing a generic collection
      return;
    }
    if (identifier.isBuiltin) {
      return createPrimitiveValuetype(identifier);
    }
    return new AtomicValuetype(identifier);
  }
  assertUnreachable(identifier);
}
