import {
  BlockExecutor,
  BlockExecutorType,
  JayveeExecExtension,
} from '@jayvee/execution';

import { CSVFileExtractorExecutor } from './lib/csv-file-extractor-executor';
import { LayoutValidatorExecutor } from './lib/layout-validator-executor';

export class TabularExecExtension implements JayveeExecExtension {
  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return [CSVFileExtractorExecutor, LayoutValidatorExecutor];
  }
}
