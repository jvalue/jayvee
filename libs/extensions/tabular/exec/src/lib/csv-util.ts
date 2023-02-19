import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import * as R from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';

export function parseAsCsv(
  rawData: string,
  delimiter: string,
): Promise<R.Result<Sheet> | Error> {
  return new Promise((resolve) => {
    const csvData: string[][] = [];
    const parseOptions: ParserOptionsArgs = { delimiter };
    parseStringAsCsv(rawData, parseOptions)
      .on('data', (data: string[]) => {
        csvData.push(data);
      })
      .on('error', (error) => {
        resolve(error);
      })
      .on('end', () => {
        const result = {
          data: csvData,
          width: getSheetWidth(csvData),
          height: csvData.length,
        };
        resolve(R.ok(result));
      });
  });
}

export function getSheetWidth(data: string[][]): number {
  return data.reduce((prev, curr) => {
    return curr.length > prev ? curr.length : prev;
  }, 0);
}
