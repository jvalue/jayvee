// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import {
  PrimitiveValuetypeKeyword,
  PrimitiveValuetypeKeywordLiteral,
  ValuetypeDefinition,
  ValuetypeDefinitionReference,
  isPrimitiveValuetypeKeywordLiteral,
  isValuetypeDefinition,
  isValuetypeDefinitionReference,
} from '../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { AtomicValuetype } from './atomic-valuetype';
import { PrimitiveValuetypes } from './primitive';
import { Valuetype } from './valuetype';

type ValuetypeIdentifier =
  | ValuetypeDefinition
  | PrimitiveValuetypeKeyword
  | 'cellRange'
  | 'constraint'
  | 'regex'
  | 'transform'
  | 'valuetypeAssignment'
  | 'collection';
const existingValuetypes = new Map<ValuetypeIdentifier, Valuetype>();

// initialize primitive valuetypes
Object.values(PrimitiveValuetypes).forEach((primitive) => {
  existingValuetypes.set(primitive.getName(), primitive);
});

/**
 * Returns the singleton valuetype instance for a given valuetype keyword or definition.
 * Manages a cache under the hood to ensure singleton behavior.
 * @returns the desired valuetype instance or undefined in case of incomplete AST nodes.
 */
export function getValuetype(
  identifier: PrimitiveValuetypeKeywordLiteral | ValuetypeDefinitionReference,
): Valuetype | undefined {
  if (isPrimitiveValuetypeKeywordLiteral(identifier)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const keyword = identifier?.keyword;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (keyword === undefined) {
      return undefined;
    }
    return createOrGetValuetype(keyword);
  } else if (isValuetypeDefinitionReference(identifier)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const referenced = identifier?.reference?.ref;
    if (referenced === undefined) {
      return undefined;
    }
    return createOrGetValuetype(referenced);
  }
  assertUnreachable(identifier);
}

function createOrGetValuetype(identifier: ValuetypeIdentifier): Valuetype {
  const existingValuetype = existingValuetypes.get(identifier);
  if (existingValuetype !== undefined) {
    return existingValuetype;
  }

  assert(isValuetypeDefinition(identifier));

  const primitive = createOrGetValuetype(identifier.type.keyword); // TODO: allow arbitrary hierarchy of atomic valuetypes in grammar
  const createdValuetype = new AtomicValuetype(identifier, primitive);
  existingValuetypes.set(identifier, createdValuetype);

  return createdValuetype;
}
