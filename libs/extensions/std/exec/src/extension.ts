import { BlockExecutorClass, JayveeExecExtension } from '@jvalue/execution';
import { RdbmsExecExtension } from '@jvalue/extensions/rdbms/exec';
import { TabularExecExtension } from '@jvalue/extensions/tabular/exec';

import { ArchiveInterpreterExecutor } from './archive-interpreter-executor';
import { FilePickerExecutor } from './file-picker-executor';
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
      FilePickerExecutor,
    ];
  }
}
