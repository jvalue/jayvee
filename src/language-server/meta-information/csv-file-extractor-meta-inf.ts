import { Sheet, sheetType, undefinedType } from '../../interpreter/data-types';
import { CSVFileExtractor } from '../generated/ast';

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
