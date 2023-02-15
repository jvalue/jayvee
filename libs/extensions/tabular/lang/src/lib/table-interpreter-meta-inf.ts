import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  TABLE_TYPE,
} from '@jayvee/language-server';

export class TableInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('TableInterpreter', SHEET_TYPE, TABLE_TYPE, {
      header: {
        type: AttributeType.BOOLEAN,
      },
      columns: {
        type: AttributeType.DATA_TYPE_ASSIGNMENT_COLLECTION,
      },
    });
  }
}
