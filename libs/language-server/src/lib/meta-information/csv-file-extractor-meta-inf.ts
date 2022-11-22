import { CSVFileExtractor } from '../ast/generated/ast';
import { SHEET_TYPE, Sheet, UNDEFINED_TYPE } from '../types/io-types';

import { BlockMetaInformation } from './block-meta-inf';

export class CSVFileExtractorMetaInformation extends BlockMetaInformation<
  CSVFileExtractor,
  void,
  Sheet
> {
  constructor(block: CSVFileExtractor) {
    super(block, UNDEFINED_TYPE, SHEET_TYPE);
  }
}
