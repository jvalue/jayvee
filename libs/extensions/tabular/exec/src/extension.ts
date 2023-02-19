import { BlockExecutorClass, JayveeExecExtension } from '@jayvee/execution';

import { CellRangeSelectorExecutor } from './lib/cell-range-selector-executor';
import { CellWriterExecutor } from './lib/cell-writer-executor';
import { ColumnDeleterExecutor } from './lib/column-deleter-executor';
import { CSVFileExtractorExecutor } from './lib/csv-file-extractor-executor';
import { CSVInterpreterExecutor } from './lib/csv-interpreter-executor';
import { RowDeleterExecutor } from './lib/row-deleter-executor';
import { TableInterpreterExecutor } from './lib/table-interpreter-executor';

export class TabularExecExtension implements JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [
      CSVFileExtractorExecutor,
      CellWriterExecutor,
      ColumnDeleterExecutor,
      RowDeleterExecutor,
      CellRangeSelectorExecutor,
      TableInterpreterExecutor,
      CSVInterpreterExecutor,
    ];
  }
}
