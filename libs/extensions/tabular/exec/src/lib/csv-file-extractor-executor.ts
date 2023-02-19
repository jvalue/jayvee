import * as http from 'https';

import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';

import { parseAsCsv } from './csv-util';

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

    return await parseAsCsv(rawData.right, delimiter, this);
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
