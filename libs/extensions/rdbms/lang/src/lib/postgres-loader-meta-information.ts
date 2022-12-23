import {
  AttributeType,
  BlockMetaInformation,
  TABLE_TYPE,
  UNDEFINED_TYPE,
} from '@jayvee/language-server';

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
