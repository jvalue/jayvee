import { PrimitiveValueType } from '@jvalue/language-server';
import { assertUnreachable } from 'langium/lib/utils/errors';

import { AbstractValueType } from './abstract-value-type';
import { BooleanValueType } from './boolean-value-type';
import { DecimalValueType } from './decimal-value-type';
import { IntegerValueType } from './integer-value-type';
import { TextValueType } from './text-value-type';

export function getValueType(valueType: PrimitiveValueType): AbstractValueType {
  switch (valueType) {
    case 'text':
      return new TextValueType(valueType);
    case 'decimal':
      return new DecimalValueType(valueType);
    case 'integer':
      return new IntegerValueType(valueType);
    case 'boolean':
      return new BooleanValueType(valueType);
    default:
      assertUnreachable(valueType);
  }
}
