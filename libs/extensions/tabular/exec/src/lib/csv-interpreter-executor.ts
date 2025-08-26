// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import { Row, parseString as parseStringAsCsv } from '@fast-csv/parse';
import { type ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  Sheet,
  type TextFile,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class CSVInterpreterExecutor extends AbstractBlockExecutor<
  IOType.TEXT_FILE,
  IOType.SHEET
> {
  public static readonly type = 'CSVInterpreter';

  constructor() {
    super(IOType.TEXT_FILE, IOType.SHEET);
  }

  async doExecute(
    file: TextFile,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    const delimiter = context.getPropertyValue(
      'delimiter',
      context.valueTypeProvider.Primitives.Text,
    );
    const enclosing = context.getPropertyValue(
      'enclosing',
      context.valueTypeProvider.Primitives.Text,
    );
    const enclosingEscape = context.getPropertyValue(
      'enclosingEscape',
      context.valueTypeProvider.Primitives.Text,
    );

    context.logger.logDebug(
      `Parsing raw data as CSV using delimiter "${delimiter}"`,
    );

    const parseOptions: ParserOptionsArgs = {
      delimiter,
      quote: enclosing,
      escape: enclosingEscape,
    };
    return parseAsCSV(file.content, parseOptions).then(
      (csvData) => {
        context.logger.logDebug(`Parsing raw data as CSV-sheet successful`);
        return R.ok(new Sheet(csvData));
      },
      (reason) => {
        assert(reason instanceof Error);
        return R.err({
          message: reason.message,
          diagnostic: {
            node: context.getCurrentNode(),
            property: 'name',
          },
        });
      },
    );
  }
}

async function parseAsCSV(
  text: string,
  parseOptions: ParserOptionsArgs,
): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const rows: string[][] = [];
    parseStringAsCsv(text, parseOptions)
      .on('data', (row: string[]) => {
        rows.push(row);
      })
      .on('error', (error) =>
        reject(
          new Error(
            `Unexpected error while parsing CSV: ${error.name}: ${error.message}`,
          ),
        ),
      )
      .on(
        'data-invalid',
        (row: Row | null, rowCount: number, reason?: string) =>
          reject(
            new Error(
              `Invalid row ${rowCount}: ${
                reason ?? 'Unknwon reason'
              }: ${JSON.stringify(row ?? '')}`,
            ),
          ),
      )
      .on('end', () => {
        resolve(rows);
      });
  });
}
