import * as http from 'https';

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
import { ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import { pipe } from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';

import { CSVFileExtractor } from '../../language-server/generated/ast';
import { Sheet, sheetType, undefinedType } from '../data-types';

import { BlockExecutor } from './block-executor';
import * as R from './execution-result';

export class CSVFileExtractorExecutor extends BlockExecutor<
  CSVFileExtractor,
  void,
  Sheet
> {
  constructor(block: CSVFileExtractor) {
    super(block, undefinedType, sheetType);
  }

  override executeFn(): R.ResultTask<Sheet> {
    return () =>
      pipe(
        this.fetchRawDataFn(),
        TE.chain((raw) => this.parseAsCsvFn(raw)),
        TE.map((data) => {
          return {
            data: data,
            width: this.getSheetWidthFn(data),
          };
        }),
        TE.map((r) => Object.assign({ height: r.data.length }, r)),
      )();
  }

  private fetchRawDataFn(): R.ResultTask<string> {
    const url = this.block.url;
    return () =>
      new Promise((resolve) => {
        http.get(url, (response) => {
          let rawData = '';
          const responseCode = response.statusCode;

          if (responseCode === undefined || responseCode >= 400) {
            resolve(
              R.err({
                message: `Error when executing block "${
                  this.block.$type
                }". HTTP fetch failed with code ${
                  responseCode ?? 'undefined'
                }.`,
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

  private parseAsCsvFn(rawData: string): R.ResultTask<string[][]> {
    return () =>
      new Promise((resolve) => {
        const csvData: string[][] = [];
        const parseOptions: ParserOptionsArgs = {};
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

  private getSheetWidthFn(data: string[][]): number {
    return data.reduce((prev, curr) => {
      return curr.length > prev ? curr.length : prev;
    }, 0);
  }
}
