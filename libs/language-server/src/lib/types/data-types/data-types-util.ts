import { assertUnreachable } from 'langium/lib/utils/errors';

import { Type } from '../../ast/generated/ast';

import { AbstractDataType } from './AbstractDataType';
import { BooleanDataType } from './BooleanDataType';
import { DecimalDataType } from './DecimalDataType';
import { IntegerDataType } from './IntegerDataType';
import { TextDataType } from './TextDataType';

export function getDataType(name: Type): AbstractDataType {
  switch (name) {
    case 'text':
      return new TextDataType(name);
    case 'decimal':
      return new DecimalDataType(name);
    case 'integer':
      return new IntegerDataType(name);
    case 'boolean':
      return new BooleanDataType(name);
    default:
      assertUnreachable(name);
  }
}
