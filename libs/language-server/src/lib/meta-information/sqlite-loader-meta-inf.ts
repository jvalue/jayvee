import { TABLE_TYPE, UNDEFINED_TYPE } from '../types/io-types';

import { AttributeType, BlockMetaInformation } from './block-meta-inf';
import { registerBlockMetaInformation } from './meta-inf-util';

export class SQLiteLoaderMetaInformation extends BlockMetaInformation {
  constructor() {
    super('SQLiteLoader', TABLE_TYPE, UNDEFINED_TYPE, {
      table: {
        type: AttributeType.STRING,
      },
      file: {
        type: AttributeType.STRING,
      },
    });
  }
}

registerBlockMetaInformation(new SQLiteLoaderMetaInformation());
