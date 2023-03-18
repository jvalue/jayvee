import { TextDecoder } from 'util';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import * as R from '@jvalue/execution';
import {
  BlockExecutor,
  ExecutionContext,
  File,
  FileExtension,
  Sheet,
} from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';
import { Either, isLeft } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

export class CSVInterpreterExecutor
  implements BlockExecutor<IOType.FILE, IOType.SHEET>
{
  public readonly blockType = 'CSVInterpreter';
  public readonly inputType = IOType.FILE;
  public readonly outputType = IOType.SHEET;

  async execute(
    file: File,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    const delimiter = context.getTextAttributeValue('delimiter');

    if (
      file.extension === FileExtension.TXT ||
      file.extension === FileExtension.CSV
    ) {
      const decoder = new TextDecoder();
      const csvFile = decoder.decode(file.content);
      context.logger.logDebug(
        `Parsing raw data as CSV using delimiter "${delimiter}"`,
      );

      const csvData = await parseAsCsv(csvFile, delimiter);
      if (isLeft(csvData)) {
        return Promise.resolve(
          R.err({
            message: `CSV parse failed: ${csvData.left.message}`,
            diagnostic: { node: context.getCurrentNode(), property: 'name' },
          }),
        );
      }
      const sheet = new Sheet(csvData.right);

      context.logger.logDebug(`Parsing raw data as CSV-sheet successful`);
      return Promise.resolve(R.ok(sheet));
    }
    return Promise.resolve(
      R.err({
        message: `Input file's extensions expected to be ${
          FileExtension.TXT
        } or ${FileExtension.CSV} but was ${
          file.extension === FileExtension.NONE ? 'NONE' : file.extension
        }`,
        diagnostic: { node: context.getCurrentNode(), property: 'name' },
      }),
    );
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
