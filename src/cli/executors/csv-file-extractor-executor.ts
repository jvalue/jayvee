import * as http from 'https';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';

import { CSVFileExtractor } from '../../language-server/generated/ast';
import { getCstTextWithLineNumbers } from '../cli-util';
import { Sheet, sheetType, undefinedType } from '../data-types';

import { BlockExecutor } from './block-executor';

export class CSVFileExtractorExecutor extends BlockExecutor<
  CSVFileExtractor,
  void,
  Sheet
> {
  constructor(block: CSVFileExtractor) {
    super(block, undefinedType, sheetType);
  }

  override async execute(): Promise<Sheet> {
    const rawData = await this.fetchRawData();
    const data = await this.parseAsCsv(rawData);
    const width = data.reduce((prev, curr) => {
      return curr.length > prev ? curr.length : prev;
    }, 0);
    const height = data.length;

    return { data, width, height };
  }

  private async fetchRawData(): Promise<string> {
    const url = this.block.url;
    return new Promise((resolve) => {
      http.get(url, (response) => {
        let rawData = '';
        const responseCode = response.statusCode;

        if (responseCode === undefined || responseCode >= 400) {
          throw Error(this.getFetchErrorMessage(responseCode));
        }

        response.on('data', (dataChunk) => {
          rawData += dataChunk;
        });

        response.on('end', () => {
          resolve(rawData);
        });

        response.on('error', (err) => {
          throw err;
        });
      });
    });
  }

  private parseAsCsv(rawData: string): Promise<string[][]> {
    return new Promise((resolve) => {
      const csvData: string[][] = [];
      const parseOptions: ParserOptionsArgs = {};
      parseStringAsCsv(rawData, parseOptions)
        .on('data', (data: string[]) => {
          csvData.push(data);
        })
        .on('error', (error) => {
          console.warn(`Could not parse row: ${error.message}`);
        })
        .on('end', () => {
          resolve(csvData);
        });
    });
  }

  private getFetchErrorMessage(responseCode: number | undefined): string {
    return (
      `Error when executing block "${this.block.$type}".\n` +
      `HTTP fetch failed with code ${responseCode ?? 'undefined'}.\n` +
      `Please check your connection and the attribute "url" in block code\n\n` +
      `${
        this.block.$cstNode?.parent !== undefined
          ? getCstTextWithLineNumbers(this.block.$cstNode.parent)
          : ''
      }`
    );
  }
}
