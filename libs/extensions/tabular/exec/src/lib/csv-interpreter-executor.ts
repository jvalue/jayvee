// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { parseString as parseStringAsCsv } from '@fast-csv/parse';
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
import { either as E } from 'fp-ts';

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
    const csvData = await parseAsCsv(file.content, parseOptions);

    if (E.isLeft(csvData)) {
      return Promise.resolve(
        R.err({
          message: `CSV parse failed in line ${csvData.left.lineNumber}: ${csvData.left.error.message}`,
          diagnostic: { node: context.getCurrentNode(), property: 'name' },
        }),
      );
    }
    const sheet = new Sheet(csvData.right);

    context.logger.logDebug(`Parsing raw data as CSV-sheet successful`);
    return Promise.resolve(R.ok(sheet));
  }
}

async function parseAsCsv(
  lines: string[],
  parseOptions: ParserOptionsArgs,
): Promise<E.Either<{ error: Error; lineNumber: number }, string[][]>> {
  let lineNumber = 1;
  const rows: string[][] = [];
  for await (const line of lines) {
    const rowParseResult = await parseLineAsRow(line, parseOptions);
    if (E.isLeft(rowParseResult)) {
      return E.left({ error: rowParseResult.left, lineNumber });
    }
    rows.push(rowParseResult.right);

    ++lineNumber;
  }
  return E.right(rows);
}

async function parseLineAsRow(
  line: string,
  parseOptions: ParserOptionsArgs,
): Promise<E.Either<Error, string[]>> {
  return new Promise((resolve) => {
    let row: string[];
    parseStringAsCsv(line, parseOptions)
      .on('data', (data: string[]) => {
        row = data;
      })
      .on('error', (error) => {
        resolve(E.left(error));
      })
      .on('end', () => {
        resolve(E.right(row));
      });
  });
}
