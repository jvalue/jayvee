import { CSVFileExtractor } from '../../language-server/generated/ast';
import { Sheet, sheetType, undefinedType } from '../data-types';

import { BlockExecutor } from './block-executor';

export class CSVFileExtractorExecutor extends BlockExecutor<
  CSVFileExtractor,
  void,
  Sheet
> {
  constructor(block: CSVFileExtractor) {
    super(block, undefinedType, sheetType);
  }

  override execute(): Promise<Sheet> {
    // TODO #8
    return Promise.resolve([['example'], ['csv'], ['table']]);
  }
}
