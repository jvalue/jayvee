import {
  PrimitiveValuetype,
  ValuetypeReference,
  isValuetypeReference,
} from '@jvalue/language-server';
import { assertUnreachable } from 'langium/lib/utils/errors';

import { ValueType } from './abstract-value-type';
import { AtomicValueType } from './atomic-value-type';
import { BooleanValueType } from './boolean-value-type';
import { DecimalValueType } from './decimal-value-type';
import { IntegerValueType } from './integer-value-type';
import { TextValueType } from './text-value-type';

export function getValueType(
  valueType: PrimitiveValuetype | ValuetypeReference,
  runtimeParameters: Map<string, string | number | boolean>,
): ValueType {
  if (isValuetypeReference(valueType)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const valuetypeAstNode = valueType.reference.ref!;
    const primitiveValuetype = valuetypeAstNode.type;
    return new AtomicValueType(
      getPrimitiveValueType(primitiveValuetype),
      valuetypeAstNode,
      runtimeParameters,
    );
  }
  return getPrimitiveValueType(valueType);
}

function getPrimitiveValueType(
  primitiveValuetype: PrimitiveValuetype,
): ValueType {
  switch (primitiveValuetype) {
    case 'text':
      return new TextValueType();
    case 'decimal':
      return new DecimalValueType();
    case 'integer':
      return new IntegerValueType();
    case 'boolean':
      return new BooleanValueType();
    default:
      assertUnreachable(primitiveValuetype);
  }
}
