import { BlockExecutorClass, JayveeExecExtension } from '@jayvee/execution';

import { PostgresLoaderExecutor, SQLiteLoaderExecutor } from './lib';

export class RdbmsExecExtension implements JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [PostgresLoaderExecutor, SQLiteLoaderExecutor];
  }
}
