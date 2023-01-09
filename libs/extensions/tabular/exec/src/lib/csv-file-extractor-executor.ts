import * as http from 'https';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import * as R from '@jayvee/execution';
import { BlockExecutor, isDiagnostic } from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';

export class CSVFileExtractorExecutor extends BlockExecutor<void, Sheet> {
  constructor() {
    super('CSVFileExtractor');
  }

  override async execute(): Promise<R.Result<Sheet>> {
    const url = this.getStringAttributeValue('url');
    const delimiter = this.getStringAttributeValue('delimiter');

    try {
      const raw = await R.dataOrThrowAsync(this.fetchRawData(url));
      const csv = await R.dataOrThrowAsync(this.parseAsCsv(raw, delimiter));
      return R.ok({
        data: csv,
        width: this.getSheetWidth(csv),
        height: csv.length,
      });
    } catch (errorObj) {
      if (isDiagnostic(errorObj)) {
        return R.err(errorObj);
      }
      throw errorObj;
    }
  }

  private fetchRawData(url: string): Promise<R.Result<string>> {
    return new Promise((resolve) => {
      http.get(url, (response) => {
        let rawData = '';
        const responseCode = response.statusCode;

        if (responseCode === undefined || responseCode >= 400) {
          resolve(
            R.err({
              severity: 'error',
              message: `HTTP fetch failed with code ${
                responseCode ?? 'undefined'
              }. Please check your connection and the attribute "url".`,
              info: { node: this.block },
            }),
          );
        }

        response.on('data', (dataChunk) => {
          rawData += dataChunk;
        });

        response.on('end', () => {
          resolve(R.ok(rawData));
        });

        response.on('error', (errorObj) => {
          resolve(
            R.err({
              severity: 'error',
              message: errorObj.message,
              info: { node: this.block },
            }),
          );
        });
      });
    });
  }

  private parseAsCsv(
    rawData: string,
    delimiter: string,
  ): Promise<R.Result<string[][]>> {
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
              severity: 'error',
              message: `CSV parse failed on row: ${error.message}`,
              info: { node: this.block },
            }),
          );
        })
        .on('end', () => {
          resolve(R.ok(csvData));
        });
    });
  }

  private getSheetWidth(data: string[][]): number {
    return data.reduce((prev, curr) => {
      return curr.length > prev ? curr.length : prev;
    }, 0);
  }
}
