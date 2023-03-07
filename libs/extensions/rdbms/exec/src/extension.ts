import { BlockExecutorClass, JayveeExecExtension } from '@jvalue/execution';

import { PostgresLoaderExecutor, SQLiteLoaderExecutor } from './lib';

export class RdbmsExecExtension implements JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [PostgresLoaderExecutor, SQLiteLoaderExecutor];
  }
}
