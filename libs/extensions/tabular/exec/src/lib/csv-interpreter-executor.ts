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
      this.logger.logDebug(
        `Parsing raw data as CSV using delimiter "${delimiter}"`,
      );

      const sheet = await parseAsCsv(csvFile, delimiter);
      if (sheet instanceof Error) {
        return Promise.resolve(
          R.err({
            message: `CSV parse failed: ${sheet.message}`,
            diagnostic: { node: this.block, property: 'name' },
          }),
        );
      }

      if (R.isErr(sheet)) {
        return sheet;
      }
      this.logger.logDebug(`Parsing raw data as CSV successfull"`);
      return R.ok(sheet.right);
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
