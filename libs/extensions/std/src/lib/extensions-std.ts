import { BlockExecutor } from '@jayvee/execution';
import {
  CSVFileExtractorExecutor,
  CSVFileExtractorMetaInformation,
} from '@jayvee/extensions/csv';
import {
  PostgresLoaderExecutor,
  PostgresLoaderMetaInformation,
  SQLiteLoaderExecutor,
  SQLiteLoaderMetaInformation,
} from '@jayvee/extensions/rdbms';
import { BlockMetaInformation } from '@jayvee/language-server';

export interface BlockExecutorType<T extends BlockExecutor = BlockExecutor>
  extends Function {
  new (): T;
}

export function getStandardBlockMetaInformationExtensions(): BlockMetaInformation[] {
  return [
    new SQLiteLoaderMetaInformation(),
    new PostgresLoaderMetaInformation(),
    new CSVFileExtractorMetaInformation(),
  ];
}

export function getStandardBlockExecutors(): BlockExecutorType[] {
  return [
    PostgresLoaderExecutor,
    SQLiteLoaderExecutor,
    CSVFileExtractorExecutor,
  ];
}
