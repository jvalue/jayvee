import * as http from 'https';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import { Sheet } from '@jayvee/language-server';

import { BlockExecutor } from './block-executor';
import * as R from './execution-result';

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
      if (R.isExecutionErrorDetails(errorObj)) {
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
              message: `Error when executing block "${
                this.block.$type
              }". HTTP fetch failed with code ${responseCode ?? 'undefined'}.`,
              hint: `Please check your connection and the attribute "url".`,
              cstNode: this.block.$cstNode?.parent,
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
              message: `Error when executing block "${this.block.$type}".`,
              hint: errorObj.message,
              cstNode: this.block.$cstNode?.parent,
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
              message: `Error when executing block "${this.block.$type}". CSV parse failed on row.`,
              hint: error.message,
              cstNode: this.block.$cstNode?.parent,
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
