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

export function createValuetype(
  identifier: PrimitiveValuetypeKeywordLiteral | ValuetypeDefinitionReference,
): Valuetype | undefined {
  if (isPrimitiveValuetypeKeywordLiteral(identifier)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const keyword = identifier?.keyword;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (keyword === undefined) {
      return undefined;
    }
    return doCreateValuetype(keyword);
  } else if (isValuetypeDefinitionReference(identifier)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const referenced = identifier?.reference?.ref;
    if (referenced === undefined) {
      return undefined;
    }
    return doCreateValuetype(referenced);
  }
  assertUnreachable(identifier);
}

function doCreateValuetype(identifier: ValuetypeIdentifier): Valuetype {
  const existingValuetype = existingValuetypes.get(identifier);
  if (existingValuetype !== undefined) {
    return existingValuetype;
  }

  assert(isValuetypeDefinition(identifier));

  const primitive = doCreateValuetype(identifier.type.keyword); // TODO: allow arbitrary hierarchy of atomic valuetypes in grammar
  const createdValuetype = new AtomicValuetype(identifier, primitive);
  existingValuetypes.set(identifier, createdValuetype);

  return createdValuetype;
}
