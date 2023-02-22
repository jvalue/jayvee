import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

export function parseAsCsv(
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

export function getSheetWidth(data: string[][]): number {
  return data.reduce((prev, curr) => {
    return curr.length > prev ? curr.length : prev;
  }, 0);
}
