import { SHEET_TYPE, UNDEFINED_TYPE } from '../types/io-types';

import { AttributeType, BlockMetaInformation } from './block-meta-inf';
import { registerBlockMetaInformation } from './meta-inf-util';

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

registerBlockMetaInformation(new CSVFileExtractorMetaInformation());
