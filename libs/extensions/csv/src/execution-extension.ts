import {
  BlockExecutor,
  BlockExecutorType,
  JayveeInterpreterExtension,
} from '@jayvee/execution';

import { CSVFileExtractorExecutor } from './lib';

export class CsvExecutionExtension implements JayveeInterpreterExtension {
  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return [CSVFileExtractorExecutor];
  }
}
