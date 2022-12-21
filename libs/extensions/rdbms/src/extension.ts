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
  PostgresLoaderExecutor,
  PostgresLoaderMetaInformation,
  SQLiteLoaderExecutor,
  SQLiteLoaderMetaInformation,
} from './lib';

export class RdbmsExtension
  implements JayveeLangExtension, JayveeInterpreterExtension
{
  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return [PostgresLoaderExecutor, SQLiteLoaderExecutor];
  }

  getBlockMetaInf(): BlockMetaInformation[] {
    return [
      new PostgresLoaderMetaInformation(),
      new SQLiteLoaderMetaInformation(),
    ];
  }
}
