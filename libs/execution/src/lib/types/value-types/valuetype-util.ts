import {
  PrimitiveValuetypeKeyword,
  ValuetypeDefinitionReference,
  isValuetypeDefinitionReference,
} from '@jvalue/language-server';
import { assertUnreachable } from 'langium/lib/utils/errors';

import { AtomicValuetype } from './atomic-valuetype';
import { BooleanValuetype } from './boolean-valuetype';
import { DecimalValuetype } from './decimal-valuetype';
import { IntegerValuetype } from './integer-valuetype';
import { TextValuetype } from './text-valuetype';
import { Valuetype } from './valuetype';

export function getValueType(
  valueType: PrimitiveValuetypeKeyword | ValuetypeDefinitionReference,
): Valuetype {
  if (isValuetypeDefinitionReference(valueType)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const valuetypeAstNode = valueType.reference.ref!;
    const primitiveValuetype = valuetypeAstNode.type;
    return new AtomicValuetype(
      getPrimitiveValueType(primitiveValuetype),
      valuetypeAstNode,
    );
  }
  return getPrimitiveValueType(valueType);
}

function getPrimitiveValueType(
  primitiveValuetype: PrimitiveValuetypeKeyword,
): Valuetype {
  switch (primitiveValuetype) {
    case 'text':
      return new TextValuetype();
    case 'decimal':
      return new DecimalValuetype();
    case 'integer':
      return new IntegerValuetype();
    case 'boolean':
      return new BooleanValuetype();
    default:
      assertUnreachable(primitiveValuetype);
  }
}
