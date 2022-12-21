import { getStandardBlockExecutors } from '@jayvee/extensions/std';

import { CSVFileExtractorExecutor } from './csv-file-extractor-executor';
import { LayoutValidatorExecutor } from './layout-validator-executor';
import { registerBlockExecutor } from './utils/block-executor-registry';

export function registerBlockExecutors(): void {
  registerBlockExecutor(CSVFileExtractorExecutor);
  registerBlockExecutor(LayoutValidatorExecutor);

  getStandardBlockExecutors().forEach(registerBlockExecutor);
}
