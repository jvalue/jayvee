import * as http from 'https';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import * as E from 'fp-ts/lib/Either';

import { CSVFileExtractor } from '../../language-server/generated/ast';
import { Sheet, sheetType, undefinedType } from '../data-types';

import { BlockExecutor, ExecutionError } from './block-executor';

export class CSVFileExtractorExecutor extends BlockExecutor<
  CSVFileExtractor,
  void,
  Sheet
> {
  constructor(block: CSVFileExtractor) {
    super(block, undefinedType, sheetType);
  }

  override async execute(): Promise<E.Either<Sheet, ExecutionError>> {
    const downloadResult = await this.fetchRawData();
    if (downloadResult._tag === 'Right') {
      return downloadResult;
    }

    const parseResult = await this.parseAsCsv(downloadResult.left);
    if (parseResult._tag === 'Right') {
      return parseResult;
    }
    const data = parseResult.left;

    const width = data.reduce((prev, curr) => {
      return curr.length > prev ? curr.length : prev;
    }, 0);
    const height = data.length;

    return E.left({ data, width, height });
  }

  private fetchRawData(): Promise<E.Either<string, ExecutionError>> {
    const url = this.block.url;
    return new Promise((resolve) => {
      http.get(url, (response) => {
        let rawData = '';
        const responseCode = response.statusCode;

        if (responseCode === undefined || responseCode >= 400) {
          resolve(
            E.right({
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
          resolve(E.left(rawData));
        });

        response.on('error', (err) => {
          resolve(
            E.right({
              message: `Error when executing block "${this.block.$type}".`,
              hint: err.message,
              cstNode: this.block.$cstNode?.parent,
            }),
          );
        });
      });
    });
  }

  private parseAsCsv(
    rawData: string,
  ): Promise<E.Either<string[][], ExecutionError>> {
    return new Promise((resolve) => {
      const csvData: string[][] = [];
      const parseOptions: ParserOptionsArgs = {};
      parseStringAsCsv(rawData, parseOptions)
        .on('data', (data: string[]) => {
          csvData.push(data);
        })
        .on('error', (error) => {
          resolve(
            E.right({
              message: `Error when executing block "${this.block.$type}". CSV parse failed on row.`,
              hint: error.message,
              cstNode: this.block.$cstNode?.parent,
            }),
          );
        })
        .on('end', () => {
          resolve(E.left(csvData));
        });
    });
  }
}
