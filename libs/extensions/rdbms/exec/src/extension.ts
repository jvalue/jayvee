import { BlockExecutorType, JayveeExecExtension } from '@jayvee/execution';

import { PostgresLoaderExecutor, SQLiteLoaderExecutor } from './lib';

export class RdbmsExecExtension implements JayveeExecExtension {
  getBlockExecutors(): BlockExecutorType[] {
    return [PostgresLoaderExecutor, SQLiteLoaderExecutor];
  }
}
