import fetch from 'node-fetch'; // TODO: find other library that does not have compilation errors with latest version

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
    // Fetch
    await this.fetchRawData();

    // Interpret
    // TODO

    return Promise.resolve([['example'], ['csv'], ['table']]);
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
}
