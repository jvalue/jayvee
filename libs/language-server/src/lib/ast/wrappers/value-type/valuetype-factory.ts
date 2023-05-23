// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import {
  PrimitiveValuetypeKeyword,
  ValuetypeDefinition,
  ValuetypeReference,
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
 * @returns the desired valuetype instance or undefined in case of incomplete AST nodes or a cycle in the hierarchy.
 */
export function getValuetype(
  identifier: ValuetypeDefinition | ValuetypeReference | undefined,
  visitedSupertypes: ValuetypeReference[] = [],
): Valuetype | undefined {
  if (identifier === undefined) {
    return undefined;
  }

  if (isPrimitiveValuetypeKeywordLiteral(identifier)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const keyword = identifier?.keyword;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (keyword === undefined) {
      return undefined;
    }
    return createOrGetValuetype(keyword, visitedSupertypes);
  } else if (isValuetypeDefinition(identifier)) {
    return createOrGetValuetype(identifier, visitedSupertypes);
  } else if (isValuetypeDefinitionReference(identifier)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const referenced = identifier?.reference?.ref;
    if (referenced === undefined) {
      return undefined;
    }
    return createOrGetValuetype(referenced, visitedSupertypes);
  }
  assertUnreachable(identifier);
}

function createOrGetValuetype(
  identifier: ValuetypeIdentifier,
  visitedSupertypes: ValuetypeReference[] = [],
): Valuetype | undefined {
  const existingValuetype = existingValuetypes.get(identifier);
  if (existingValuetype !== undefined) {
    return existingValuetype;
  }

  assert(isValuetypeDefinition(identifier));

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const identifierType = identifier?.type;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (identifierType === undefined) {
    return undefined;
  }

  const isCycleDetected = visitedSupertypes.includes(identifierType);
  if (isCycleDetected) {
    return undefined;
  }
  visitedSupertypes.push(identifierType);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const supertype = getValuetype(identifier?.type, visitedSupertypes);
  if (supertype === undefined) {
    return undefined;
  }

  const createdValuetype = new AtomicValuetype(identifier, supertype);
  existingValuetypes.set(identifier, createdValuetype);

  return createdValuetype;
}
