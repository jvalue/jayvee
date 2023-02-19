import * as http from 'https';

import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';
import * as E from 'fp-ts/lib/Either';

import { getSheetWidth, parseAsCsv } from './csv-util';

export class CSVFileExtractorExecutor extends BlockExecutor<void, Sheet> {
  constructor() {
    super('CSVFileExtractor');
  }

  override async execute(): Promise<R.Result<Sheet>> {
    const url = this.getStringAttributeValue('url');
    const delimiter = this.getStringAttributeValue('delimiter');

    this.logger.logDebug(
      `Parsing raw data as CSV using delimiter "${delimiter}"`,
    );

    const rawData = await this.fetchRawData(url);
    if (R.isErr(rawData)) {
      return rawData;
    }
    this.logger.logDebug(
      `Parsing raw data as CSV using delimiter "${delimiter}"`,
    );

    const csvData = await parseAsCsv(rawData.right, delimiter);
    if (E.isLeft(csvData)) {
      return Promise.resolve(
        R.err({
          message: `CSV parse failed: ${csvData.left.message}`,
          diagnostic: { node: this.block, property: 'name' },
        }),
      );
    }
    const sheet = {
      data: csvData.right,
      width: getSheetWidth(csvData.right),
      height: csvData.right.length,
    };

    this.logger.logDebug(`Parsing raw data as CSV-sheet successfull`);
    return Promise.resolve(R.ok(sheet));
  }

  private fetchRawData(url: string): Promise<R.Result<string>> {
    this.logger.logDebug(`Fetching raw data from ${url}`);
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
          this.logger.logDebug(`Successfully fetched raw data`);
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
}
