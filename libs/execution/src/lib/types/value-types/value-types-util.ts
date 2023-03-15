import {
  PrimitiveValuetype,
  ValuetypeReference,
  isValuetypeReference,
} from '@jvalue/language-server';
import { assertUnreachable } from 'langium/lib/utils/errors';

import { AbstractValueType } from './abstract-value-type';
import { BooleanValueType } from './boolean-value-type';
import { DecimalValueType } from './decimal-value-type';
import { IntegerValueType } from './integer-value-type';
import { TextValueType } from './text-value-type';

export function getValueType(
  valueType: PrimitiveValuetype | ValuetypeReference,
): AbstractValueType {
  const primitiveValuetype: PrimitiveValuetype = isValuetypeReference(valueType)
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      valueType.reference.ref!.type
    : valueType;
  switch (primitiveValuetype) {
    case 'text':
      return new TextValueType(primitiveValuetype);
    case 'decimal':
      return new DecimalValueType(primitiveValuetype);
    case 'integer':
      return new IntegerValueType(primitiveValuetype);
    case 'boolean':
      return new BooleanValueType(primitiveValuetype);
    default:
      assertUnreachable(primitiveValuetype);
  }
}
