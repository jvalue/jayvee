import {
  AttributeType,
  BlockMetaInformation,
  TABLE_TYPE,
  UNDEFINED_TYPE,
} from '@jayvee/language-server';

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
