import { CSVFileExtractorExecutor } from './csv-file-extractor-executor';
import { LayoutValidatorExecutor } from './layout-validator-executor';
import { PostgresLoaderExecutor } from './postgres-loader-executor';
import { SQLiteLoaderExecutor } from './sqlite-loader-executor';
import { registerBlockExecutor } from './utils/block-executor-registry';

export function registerBlockExecutors(): void {
  registerBlockExecutor(CSVFileExtractorExecutor);
  registerBlockExecutor(LayoutValidatorExecutor);
  registerBlockExecutor(PostgresLoaderExecutor);
  registerBlockExecutor(SQLiteLoaderExecutor);
}
