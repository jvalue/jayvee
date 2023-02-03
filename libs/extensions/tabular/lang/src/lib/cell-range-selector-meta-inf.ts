import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
} from '@jayvee/language-server';

export class CellRangeSelectorMetaInformation extends BlockMetaInformation {
  constructor() {
    super('CellRangeSelector', SHEET_TYPE, SHEET_TYPE, {
      select: {
        type: AttributeType.CELL_RANGE,
      },
    });
  }
}
