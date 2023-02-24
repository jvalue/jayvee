import { DataType } from '@jayvee/language-server';
import { assertUnreachable } from 'langium/lib/utils/errors';

import { AbstractDataType } from './AbstractDataType';
import { BooleanDataType } from './BooleanDataType';
import { DecimalDataType } from './DecimalDataType';
import { IntegerDataType } from './IntegerDataType';
import { TextDataType } from './TextDataType';

export function getDataType(dataType: DataType): AbstractDataType {
  switch (dataType) {
    case 'text':
      return new TextDataType(dataType);
    case 'decimal':
      return new DecimalDataType(dataType);
    case 'integer':
      return new IntegerDataType(dataType);
    case 'boolean':
      return new BooleanDataType(dataType);
    default:
      assertUnreachable(dataType);
  }
}
