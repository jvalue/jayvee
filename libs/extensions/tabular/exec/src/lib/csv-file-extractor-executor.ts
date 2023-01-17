import * as http from 'https';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';

export class CSVFileExtractorExecutor extends BlockExecutor<void, Sheet> {
  constructor() {
    super('CSVFileExtractor');
  }

  override async execute(): Promise<R.Result<Sheet>> {
    const url = this.getStringAttributeValue('url');
    const delimiter = this.getStringAttributeValue('delimiter');

    const rawData = await this.fetchRawData(url);
    if (R.isErr(rawData)) {
      return rawData;
    }

    return await this.parseAsCsv(rawData.right, delimiter);
  }

  private fetchRawData(url: string): Promise<R.Result<string>> {
    this.logger.logInfo(`Fetching raw data from ${url}`);
    return new Promise((resolve) => {
      http.get(url, (response) => {
        let rawData = '';
        const responseCode = response.statusCode;

        if (responseCode === undefined || responseCode >= 400) {
          resolve(
            R.err({
              message: `HTTP fetch failed with code ${
                responseCode ?? 'undefined'
              }. Please check your connection.`,
              diagnostic: { node: this.getOrFailAttribute('url') },
            }),
          );
        }

        response.on('data', (dataChunk) => {
          rawData += dataChunk;
        });

        response.on('end', () => {
          this.logger.logInfo(`Successfully fetched raw data`);
          resolve(R.ok(rawData));
        });

        response.on('error', (errorObj) => {
          resolve(
            R.err({
              message: errorObj.message,
              diagnostic: { node: this.block, property: 'name' },
            }),
          );
        });
      });
    });
  }

  private parseAsCsv(
    rawData: string,
    delimiter: string,
  ): Promise<R.Result<Sheet>> {
    this.logger.logInfo(
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
                node: this.block,
              },
            }),
          );
        })
        .on('end', () => {
          const result = {
            data: csvData,
            width: this.getSheetWidth(csvData),
            height: csvData.length,
          };
          this.logger.logInfo(`Successfully parsed data as CSV`);
          resolve(R.ok(result));
        });
    });
  }

  private getSheetWidth(data: string[][]): number {
    return data.reduce((prev, curr) => {
      return curr.length > prev ? curr.length : prev;
    }, 0);
  }
}
