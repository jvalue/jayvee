import {
  BlockExecutor,
  BlockExecutorType,
  JayveeInterpreterExtension,
} from '@jayvee/execution';
import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

import {
  CSVFileExtractorExecutor,
  CSVFileExtractorMetaInformation,
} from './lib';

export class CsvExtension
  implements JayveeLangExtension, JayveeInterpreterExtension
{
  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return [CSVFileExtractorExecutor];
  }

  getBlockMetaInf(): BlockMetaInformation[] {
    return [new CSVFileExtractorMetaInformation()];
  }
}
