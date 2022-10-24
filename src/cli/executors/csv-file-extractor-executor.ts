import { CSVFileExtractor } from '../../language-server/generated/ast';
import { Sheet, sheetType, undefinedType } from '../data-types';

import { BlockExecutor } from './block-executor';

export class CSVFileExtractorExecutor extends BlockExecutor<CSVFileExtractor> {
  constructor(block: CSVFileExtractor) {
    super(block, undefinedType, sheetType);
  }

  override execute(): Sheet {
    // TODO #8
    return [['example'], ['csv'], ['table']];
  }
}
