import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import fetch from 'node-fetch';

import { CSVFileExtractor } from '../../language-server/generated/ast';
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
    const response = await fetch(url);
    const body = await response.text();
    if (response.status >= 400) {
      throw Error(
        `Error when executing block "${this.block.$type}". HTTP fetch failed with code ${response.status}:\n${body}`,
      );
    }
    return body;
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
}
