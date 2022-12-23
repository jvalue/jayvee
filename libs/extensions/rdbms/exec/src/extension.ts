import {
  BlockExecutor,
  BlockExecutorType,
  JayveeExecExtension,
} from '@jayvee/execution';

import { PostgresLoaderExecutor, SQLiteLoaderExecutor } from './lib';

export class RdbmsExecExtension implements JayveeExecExtension {
  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return [PostgresLoaderExecutor, SQLiteLoaderExecutor];
  }
}
