// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assertUnreachable } from 'langium/lib/utils/errors';

import {
  PrimitiveValuetypeKeywordLiteral,
  ValuetypeDefinitionReference,
  isValuetypeDefinitionReference,
} from '../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { AtomicValuetype } from './atomic-valuetype';
import { PrimitiveValuetypes } from './primitive';
import { PrimitiveValuetype } from './primitive/primitive-valuetype';
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
      return PrimitiveValuetypes.Text;
    case 'decimal':
      return PrimitiveValuetypes.Decimal;
    case 'integer':
      return PrimitiveValuetypes.Integer;
    case 'boolean':
      return PrimitiveValuetypes.Boolean;
    default:
      assertUnreachable(keywordLiteral.keyword);
  }
}

export function getValuetypeName(
  valuetype: PrimitiveValuetypeKeywordLiteral | ValuetypeDefinitionReference,
): string {
  if (isValuetypeDefinitionReference(valuetype)) {
    return valuetype.reference.$refText;
  }
  return valuetype.keyword;
}
