import { TextDecoder } from 'util';

import * as R from '@jayvee/execution';
import { BlockExecutor } from '@jayvee/execution';
import { File, FileExtension, Sheet } from '@jayvee/language-server';

import { parseAsCsv } from './csv-util';

export class CSVInterpreterExecutor extends BlockExecutor<File, Sheet> {
  constructor() {
    // Needs to match the name in meta information:
    super('CSVInterpreter');
  }

  override async execute(file: File): Promise<R.Result<Sheet>> {
    const delimiter = this.getStringAttributeValue('delimiter');

    if (
      file.extension === FileExtension.TXT ||
      file.extension === FileExtension.CSV
    ) {
      const decoder = new TextDecoder();
      const csvFile = decoder.decode(file.content);
      return await parseAsCsv(csvFile, delimiter, this);
    }
    return Promise.resolve(
      R.err({
        message: `Input file's extensions expecteced to be ${
          FileExtension.TXT
        } or ${FileExtension.CSV} but was ${
          file.extension === FileExtension.NONE ? 'NONE' : file.extension
        }`,
        diagnostic: { node: this.block, property: 'name' },
      }),
    );
  }
}
