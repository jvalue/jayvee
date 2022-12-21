import {
  BlockExecutor,
  BlockExecutorType,
  JayveeInterpreterExtension,
} from '@jayvee/execution';

import { CSVFileExtractorExecutor } from './lib/csv-file-extractor-executor';
import { LayoutValidatorExecutor } from './lib/layout-validator-executor';

export class TabularExecExtension implements JayveeInterpreterExtension {
  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return [CSVFileExtractorExecutor, LayoutValidatorExecutor];
  }
}
