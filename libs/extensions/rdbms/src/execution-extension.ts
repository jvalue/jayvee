import {
  BlockExecutor,
  BlockExecutorType,
  JayveeInterpreterExtension,
} from '@jayvee/execution';

import { PostgresLoaderExecutor, SQLiteLoaderExecutor } from './lib';

export class RdbmsExecutionExtension implements JayveeInterpreterExtension {
  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return [PostgresLoaderExecutor, SQLiteLoaderExecutor];
  }
}
