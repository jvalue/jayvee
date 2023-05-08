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
import { Primitive } from './primitive';
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
      return Primitive.Text;
    case 'decimal':
      return Primitive.Decimal;
    case 'integer':
      return Primitive.Integer;
    case 'boolean':
      return Primitive.Boolean;
    default:
      assertUnreachable(keywordLiteral.keyword);
  }
}
