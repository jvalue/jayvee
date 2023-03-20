import { TextDecoder } from 'util';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import * as R from '@jvalue/execution';
import { BlockExecutor, File, Sheet } from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';
import * as E from 'fp-ts/lib/Either';
import { Either, isLeft } from 'fp-ts/lib/Either';

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
    const sheet = new Sheet(csvData.right);

    this.logger.logDebug(`Parsing raw data as CSV-sheet successful`);
    return Promise.resolve(R.ok(sheet));
  }
}

function parseAsCsv(
  rawData: string,
  delimiter: string,
): Promise<Either<Error, string[][]>> {
  return new Promise((resolve) => {
    const csvData: string[][] = [];
    const parseOptions: ParserOptionsArgs = { delimiter };
    parseStringAsCsv(rawData, parseOptions)
      .on('data', (data: string[]) => {
        csvData.push(data);
      })
      .on('error', (error) => {
        resolve(E.left(error));
      })
      .on('end', () => {
        resolve(E.right(csvData));
      });
  });
}
