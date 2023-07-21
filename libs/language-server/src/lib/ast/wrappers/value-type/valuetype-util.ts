// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assertUnreachable } from 'langium';

import {
  ValuetypeDefinition,
  ValuetypeReference,
  isPrimitiveValuetypeKeywordLiteral,
  isValuetypeDefinition,
  isValuetypeDefinitionReference,
  isValuetypeReference,
} from '../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { AtomicValuetype } from './atomic-valuetype';
import { createPrimitiveValuetype } from './primitive';
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
    if (isPrimitiveValuetypeKeywordLiteral(identifier)) {
      return createPrimitiveValuetype(identifier);
    } else if (isValuetypeDefinitionReference(identifier)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const referenced = identifier?.reference?.ref;
      if (referenced === undefined) {
        return undefined;
      }

      return new AtomicValuetype(referenced);
    }
    assertUnreachable(identifier);
  } else if (isValuetypeDefinition(identifier)) {
    return new AtomicValuetype(identifier);
  }
  assertUnreachable(identifier);
}
