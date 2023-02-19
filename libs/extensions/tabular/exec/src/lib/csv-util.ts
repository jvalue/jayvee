import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import * as R from '@jayvee/execution';
import { BlockExecutor } from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';

export function parseAsCsv(
  rawData: string,
  delimiter: string,
  blockExecutor: BlockExecutor,
): Promise<R.Result<Sheet>> {
  blockExecutor.logger.logDebug(
    `Parsing raw data as CSV using delimiter "${delimiter}"`,
  );

  return new Promise((resolve) => {
    const csvData: string[][] = [];
    const parseOptions: ParserOptionsArgs = { delimiter };
    parseStringAsCsv(rawData, parseOptions)
      .on('data', (data: string[]) => {
        csvData.push(data);
      })
      .on('error', (error) => {
        resolve(
          R.err({
            message: `CSV parse failed: ${error.message}`,
            diagnostic: {
              node: blockExecutor.block,
              property: 'name',
            },
          }),
        );
      })
      .on('end', () => {
        const result = {
          data: csvData,
          width: getSheetWidth(csvData),
          height: csvData.length,
        };
        blockExecutor.logger.logDebug(`Successfully parsed data as CSV`);
        resolve(R.ok(result));
      });
  });
}

export function getSheetWidth(data: string[][]): number {
  return data.reduce((prev, curr) => {
    return curr.length > prev ? curr.length : prev;
  }, 0);
}
