import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  UNDEFINED_TYPE,
} from '@jayvee/language-server';

export class CSVFileExtractorMetaInformation extends BlockMetaInformation {
  constructor() {
    super('CSVFileExtractor', UNDEFINED_TYPE, SHEET_TYPE, {
      url: {
        type: AttributeType.STRING,
      },
      delimiter: {
        type: AttributeType.STRING,
        defaultValue: ',',
      },
    });
  }
}
