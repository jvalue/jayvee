import {
  BlockExecutor,
  BlockExecutorType,
  JayveeExecExtension,
} from '@jayvee/execution';
import { RdbmsExecExtension } from '@jayvee/extensions/rdbms/exec';
import { TabularExecExtension } from '@jayvee/extensions/tabular/exec';

export class StdExecExtension implements JayveeExecExtension {
  private readonly wrappedExtensions: JayveeExecExtension[] = [
    new TabularExecExtension(),
    new RdbmsExecExtension(),
  ];

  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return this.wrappedExtensions.map((x) => x.getBlockExecutors()).flat();
  }
}
