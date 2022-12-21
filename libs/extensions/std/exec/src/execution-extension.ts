import {
  BlockExecutor,
  BlockExecutorType,
  JayveeInterpreterExtension,
} from '@jayvee/execution';
import { CsvExecutionExtension } from '@jayvee/extensions/csv';
import { LayoutExecutionExtension } from '@jayvee/extensions/layout';
import { RdbmsExecutionExtension } from '@jayvee/extensions/rdbms/exec';

export class StdExecutionExtension implements JayveeInterpreterExtension {
  private readonly wrappedExtensions: JayveeInterpreterExtension[] = [
    new CsvExecutionExtension(),
    new RdbmsExecutionExtension(),
    new LayoutExecutionExtension(),
  ];

  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return this.wrappedExtensions.map((x) => x.getBlockExecutors()).flat();
  }
}
