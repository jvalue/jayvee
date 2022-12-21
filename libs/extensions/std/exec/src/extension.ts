import {
  BlockExecutor,
  BlockExecutorType,
  JayveeInterpreterExtension,
} from '@jayvee/execution';
import { RdbmsExecutionExtension } from '@jayvee/extensions/rdbms/exec';
import { TabularExecExtension } from '@jayvee/extensions/tabular/exec';

export class StdExecutionExtension implements JayveeInterpreterExtension {
  private readonly wrappedExtensions: JayveeInterpreterExtension[] = [
    new TabularExecExtension(),
    new RdbmsExecutionExtension(),
  ];

  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return this.wrappedExtensions.map((x) => x.getBlockExecutors()).flat();
  }
}
