import { TextDecoder } from 'util';

import * as R from '@jayvee/execution';
import { BlockExecutor, File, FileExtension, Sheet } from '@jayvee/execution';
import { IOType } from '@jayvee/language-server';
import { isLeft } from 'fp-ts/lib/Either';

import { getSheetWidth, parseAsCsv } from './csv-util';

export class CSVInterpreterExecutor extends BlockExecutor<
  IOType.FILE,
  IOType.SHEET
> {
  constructor() {
    // Needs to match the name in meta information:
    super('CSVInterpreter', IOType.FILE, IOType.SHEET);
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

      const csvData = await parseAsCsv(csvFile, delimiter);
      if (isLeft(csvData)) {
        return Promise.resolve(
          R.err({
            message: `CSV parse failed: ${csvData.left.message}`,
            diagnostic: { node: this.block, property: 'name' },
          }),
        );
      }
      const sheet: Sheet = {
        ioType: IOType.SHEET,
        data: csvData.right,
        width: getSheetWidth(csvData.right),
        height: csvData.right.length,
      };

      this.logger.logDebug(`Parsing raw data as CSV-sheet successfull`);
      return Promise.resolve(R.ok(sheet));
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
