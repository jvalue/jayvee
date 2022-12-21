import {
  BlockExecutor,
  BlockExecutorType,
  JayveeInterpreterExtension,
} from '@jayvee/execution';
import { CsvExecutionExtension } from '@jayvee/extensions/csv';
import { RdbmsExecutionExtension } from '@jayvee/extensions/rdbms';

export class StdExecutionExtension implements JayveeInterpreterExtension {
  private readonly wrappedExtensions: JayveeInterpreterExtension[] = [
    new CsvExecutionExtension(),
    new RdbmsExecutionExtension(),
  ];

  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return this.wrappedExtensions.map((x) => x.getBlockExecutors()).flat();
  }
}
