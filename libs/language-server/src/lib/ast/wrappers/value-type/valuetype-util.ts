// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assertUnreachable } from 'langium/lib/utils/errors';

import {
  PrimitiveValuetypeKeywordLiteral,
  ValuetypeDefinitionReference,
  isValuetypeDefinitionReference,
} from '../../generated/ast';

import { AtomicValuetype } from './atomic-valuetype';
import { BooleanValuetype } from './primitive/boolean-valuetype';
import { DecimalValuetype } from './primitive/decimal-valuetype';
import { IntegerValuetype } from './primitive/integer-valuetype';
import { PrimitiveValuetype } from './primitive/primitive-valuetype';
import { TextValuetype } from './primitive/text-valuetype';
import { Valuetype } from './valuetype';

export function createValuetype(
  valuetype: PrimitiveValuetypeKeywordLiteral | ValuetypeDefinitionReference,
): Valuetype {
  if (isValuetypeDefinitionReference(valuetype)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const valuetypeDefinition = valuetype.reference.ref!;
    const primitiveValuetypeKeyword = valuetypeDefinition.type;
    const primitiveValuetype = createPrimitiveValuetype(
      primitiveValuetypeKeyword,
    );
    return new AtomicValuetype(valuetypeDefinition, primitiveValuetype);
  }
  return createPrimitiveValuetype(valuetype);
}

function createPrimitiveValuetype(
  keywordLiteral: PrimitiveValuetypeKeywordLiteral,
): PrimitiveValuetype {
  switch (keywordLiteral.keyword) {
    case 'text':
      return new TextValuetype(keywordLiteral);
    case 'decimal':
      return new DecimalValuetype(keywordLiteral);
    case 'integer':
      return new IntegerValuetype(keywordLiteral);
    case 'boolean':
      return new BooleanValuetype(keywordLiteral);
    default:
      assertUnreachable(keywordLiteral.keyword);
  }
}
