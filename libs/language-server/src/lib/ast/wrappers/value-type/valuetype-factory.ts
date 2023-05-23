// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import {
  PrimitiveValuetypeKeyword,
  PrimitiveValuetypeKeywordLiteral,
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
): Valuetype | undefined {
  if (hasSupertypeCycle(identifier)) {
    return undefined;
  }

  return doGetValuetype(identifier);
}

function doGetValuetype(
  identifier: ValuetypeDefinition | ValuetypeReference | undefined,
): Valuetype | undefined {
  if (identifier === undefined) {
    return undefined;
  }

  if (isPrimitiveValuetypeKeywordLiteral(identifier)) {
    return doGetPrimitiveValuetype(identifier);
  } else if (isValuetypeDefinition(identifier)) {
    return doCreateOrGetValuetype(identifier);
  } else if (isValuetypeDefinitionReference(identifier)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const referenced = identifier?.reference?.ref;
    if (referenced === undefined) {
      return undefined;
    }
    return doCreateOrGetValuetype(referenced);
  }
  assertUnreachable(identifier);
}

function doGetPrimitiveValuetype(
  keywordLiteral: PrimitiveValuetypeKeywordLiteral,
): Valuetype | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const keyword = keywordLiteral?.keyword;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (keyword === undefined) {
    return undefined;
  }

  const existingValuetype = existingValuetypes.get(keyword);
  assert(existingValuetype !== undefined);
  return existingValuetype;
}

function doCreateOrGetValuetype(
  identifier: ValuetypeDefinition,
): Valuetype | undefined {
  const existingValuetype = existingValuetypes.get(identifier);
  if (existingValuetype !== undefined) {
    return existingValuetype;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const supertypeIdentifier = identifier?.type;
  const supertype = doGetValuetype(supertypeIdentifier);
  if (supertype === undefined) {
    return undefined;
  }

  const createdValuetype = new AtomicValuetype(identifier, supertype);
  existingValuetypes.set(identifier, createdValuetype);

  return createdValuetype;
}

export function hasSupertypeCycle(
  identifier: ValuetypeDefinition | ValuetypeReference | undefined,
  visitedSupertypes: ValuetypeReference[] = [],
): boolean {
  if (identifier === undefined) {
    return false;
  }

  if (isPrimitiveValuetypeKeywordLiteral(identifier)) {
    return false;
  } else if (isValuetypeDefinition(identifier)) {
    return doHasSupertypeCycle(identifier, visitedSupertypes);
  } else if (isValuetypeDefinitionReference(identifier)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const referenced = identifier?.reference?.ref;
    if (referenced === undefined) {
      return false;
    }
    return doHasSupertypeCycle(referenced, visitedSupertypes);
  }
  assertUnreachable(identifier);
}

function doHasSupertypeCycle(
  identifier: ValuetypeDefinition,
  visitedSupertypes: ValuetypeReference[] = [],
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const supertypeIdentifier = identifier?.type;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (supertypeIdentifier === undefined) {
    return false;
  }

  const isCycleDetected = visitedSupertypes.includes(supertypeIdentifier);
  if (isCycleDetected) {
    return true;
  }
  visitedSupertypes.push(supertypeIdentifier);

  return hasSupertypeCycle(supertypeIdentifier, visitedSupertypes);
}
