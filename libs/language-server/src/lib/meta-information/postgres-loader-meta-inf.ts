import { TABLE_TYPE, UNDEFINED_TYPE } from '../types/io-types';

import { AttributeType, BlockMetaInformation } from './block-meta-inf';
import { registerBlockMetaInformation } from './meta-inf-util';

export class PostgresLoaderMetaInformation extends BlockMetaInformation {
  constructor() {
    super('PostgresLoader', TABLE_TYPE, UNDEFINED_TYPE, {
      host: {
        type: AttributeType.STRING,
      },
      port: {
        type: AttributeType.INT,
      },
      username: {
        type: AttributeType.STRING,
      },
      password: {
        type: AttributeType.STRING,
      },
      database: {
        type: AttributeType.STRING,
      },
      table: {
        type: AttributeType.STRING,
      },
    });
  }
}

registerBlockMetaInformation(new PostgresLoaderMetaInformation());
