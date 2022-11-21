import { CSVFileExtractor } from '../generated/ast';
import { Sheet, sheetType, undefinedType } from '../types';

import { BlockMetaInformation } from './block-meta-inf';

export class CSVFileExtractorMetaInformation extends BlockMetaInformation<
  CSVFileExtractor,
  void,
  Sheet
> {
  constructor(block: CSVFileExtractor) {
    super(block, undefinedType, sheetType);
  }
}
