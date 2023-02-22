import { BlockExecutorClass, JayveeExecExtension } from '@jayvee/execution';
import { RdbmsExecExtension } from '@jayvee/extensions/rdbms/exec';
import { TabularExecExtension } from '@jayvee/extensions/tabular/exec';

import { ArchiveInterpreterExecutor } from './archive-interpreter-executor';
import { HttpExtractorExecutor } from './http-extractor-executor';

export class StdExecExtension implements JayveeExecExtension {
  private readonly wrappedExtensions: JayveeExecExtension[] = [
    new TabularExecExtension(),
    new RdbmsExecExtension(),
  ];

  getBlockExecutors(): BlockExecutorClass[] {
    return [
      ...this.wrappedExtensions.map((x) => x.getBlockExecutors()).flat(),
      HttpExtractorExecutor,
      ArchiveInterpreterExecutor,
    ];
  }
}
