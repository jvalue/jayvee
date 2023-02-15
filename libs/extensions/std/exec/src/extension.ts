import { BlockExecutorType, JayveeExecExtension } from '@jayvee/execution';
import { RdbmsExecExtension } from '@jayvee/extensions/rdbms/exec';
import { TabularExecExtension } from '@jayvee/extensions/tabular/exec';

export class StdExecExtension implements JayveeExecExtension {
  private readonly wrappedExtensions: JayveeExecExtension[] = [
    new TabularExecExtension(),
    new RdbmsExecExtension(),
  ];

  getBlockExecutors(): BlockExecutorType[] {
    return this.wrappedExtensions.map((x) => x.getBlockExecutors()).flat();
  }
}
