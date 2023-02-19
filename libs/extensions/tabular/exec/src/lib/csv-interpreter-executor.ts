import { TextDecoder } from 'util';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import * as R from '@jayvee/execution';
import { BlockExecutor } from '@jayvee/execution';
import { File, FileExtension, Sheet } from '@jayvee/language-server';

export class CSVInterpreterExecutor extends BlockExecutor<File, Sheet> {
  constructor() {
    // Needs to match the name in meta information:
    super('CSVInterpreter');
  }

  override async execute(file: File): Promise<R.Result<Sheet>> {
    const delimiter = this.getStringAttributeValue('delimiter');

    if (file.extension !== FileExtension.ZIP) {
      return Promise.resolve(
        R.err({
          message: `Input file's extensions expecteced to be ${
            FileExtension.ZIP
          } but was ${
            file.extension === FileExtension.NONE ? 'NONE' : file.extension
          }`,
          diagnostic: { node: this.block, property: 'name' },
        }),
      );
    }

    const decoder = new TextDecoder();
    const csvFile = decoder.decode(file.content);
    return await this.parseAsCsv(csvFile, delimiter);
  }

  private parseAsCsv(
    rawData: string,
    delimiter: string,
  ): Promise<R.Result<Sheet>> {
    this.logger.logDebug(
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
                property: 'name',
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
          this.logger.logDebug(`Successfully parsed data as CSV`);
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
