import { TextDecoder } from 'util';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import * as R from '@jvalue/execution';
import {
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  File,
  Sheet,
  implementsStatic,
} from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';
import * as E from 'fp-ts/lib/Either';
import { Either, isLeft } from 'fp-ts/lib/Either';

@implementsStatic<BlockExecutorClass>()
export class CSVInterpreterExecutor
  implements BlockExecutor<IOType.FILE, IOType.SHEET>
{
  public static readonly type = 'CSVInterpreter';
  public readonly inputType = IOType.FILE;
  public readonly outputType = IOType.SHEET;

  async execute(
    file: File,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    const delimiter = context.getTextPropertyValue('delimiter');
    const enclosing = context.getTextPropertyValue('enclosing');
    const enclosingEscape = context.getTextPropertyValue('enclosingEscape');

    const decoder = new TextDecoder();
    const csvFile = decoder.decode(file.content);
    context.logger.logDebug(
      `Parsing raw data as CSV using delimiter "${delimiter}"`,
    );

    const parseOptions: ParserOptionsArgs = {
      delimiter,
      quote: enclosing,
      escape: enclosingEscape,
    };
    const csvData = await parseAsCsv(csvFile, parseOptions);

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
}

function parseAsCsv(
  rawData: string,
  parseOptions: ParserOptionsArgs,
): Promise<Either<Error, string[][]>> {
  return new Promise((resolve) => {
    const csvData: string[][] = [];
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
