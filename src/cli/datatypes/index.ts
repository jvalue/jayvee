import { Type } from '../../language-server/generated/ast';

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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Could not find implementation for data type: ${name}`);
  }
}
