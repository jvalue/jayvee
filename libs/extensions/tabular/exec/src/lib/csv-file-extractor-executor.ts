import * as http from 'https';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import { BlockExecutor } from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';
import * as O from 'fp-ts/Option';

export class CSVFileExtractorExecutor extends BlockExecutor<void, Sheet> {
  constructor() {
    super('CSVFileExtractor');
  }

  override async execute(): Promise<O.Option<Sheet>> {
    const url = this.getStringAttributeValue('url');
    const delimiter = this.getStringAttributeValue('delimiter');

    const rawData = await this.fetchRawData(url);
    if (O.isNone(rawData)) {
      return O.none;
    }

    return await this.parseAsCsv(rawData.value, delimiter);
  }

  private fetchRawData(url: string): Promise<O.Option<string>> {
    this.logInfo(`Fetching raw data from ${url}`);
    return new Promise((resolve) => {
      http.get(url, (response) => {
        let rawData = '';
        const responseCode = response.statusCode;

        if (responseCode === undefined || responseCode >= 400) {
          this.logErr(
            `HTTP fetch failed with code ${
              responseCode ?? 'undefined'
            }. Please check your connection.`,
            { node: this.getOrFailAttribute('url') },
          );
          resolve(O.none);
        }

        response.on('data', (dataChunk) => {
          rawData += dataChunk;
        });

        response.on('end', () => {
          this.logInfo(`Successfully fetched raw data`);
          resolve(O.some(rawData));
        });

        response.on('error', (errorObj) => {
          this.logErr(errorObj.message, { node: this.block, property: 'name' });
          resolve(O.none);
        });
      });
    });
  }

  private parseAsCsv(
    rawData: string,
    delimiter: string,
  ): Promise<O.Option<Sheet>> {
    this.logInfo(`Parsing raw data as CSV using delimiter "${delimiter}"`);
    return new Promise((resolve) => {
      const csvData: string[][] = [];
      const parseOptions: ParserOptionsArgs = { delimiter };
      parseStringAsCsv(rawData, parseOptions)
        .on('data', (data: string[]) => {
          csvData.push(data);
        })
        .on('error', (error) => {
          this.logErr(`CSV parse failed: ${error.message}`, {
            node: this.block,
          });
          resolve(O.none);
        })
        .on('end', () => {
          const result = {
            data: csvData,
            width: this.getSheetWidth(csvData),
            height: csvData.length,
          };
          this.logInfo(`Successfully parsed data as CSV`);
          resolve(O.some(result));
        });
    });
  }

  private getSheetWidth(data: string[][]): number {
    return data.reduce((prev, curr) => {
      return curr.length > prev ? curr.length : prev;
    }, 0);
  }
}
