import { BlockExecutor } from '@jayvee/execution';
import { CSVFileExtractorExecutor } from '@jayvee/extensions/csv';
import {
  PostgresLoaderExecutor,
  SQLiteLoaderExecutor,
} from '@jayvee/extensions/rdbms';

export interface BlockExecutorType<T extends BlockExecutor = BlockExecutor>
  extends Function {
  new (): T;
}

export function getStandardBlockExecutors(): BlockExecutorType[] {
  return [
    PostgresLoaderExecutor,
    SQLiteLoaderExecutor,
    CSVFileExtractorExecutor,
  ];
}
