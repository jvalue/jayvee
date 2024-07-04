// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';
import * as fsPromise from 'node:fs/promises';

import {
  type FormatterOptionsArgs,
  type Row,
  writeToBuffer as writeToCSVBuffer,
} from '@fast-csv/format';
import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  type Table,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import {
  IOType,
  type InternalValueRepresentation,
} from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class CSVFileLoaderExecutor extends AbstractBlockExecutor<
  IOType.TABLE,
  IOType.NONE
> {
  public static readonly type = 'CSVFileLoader';

  constructor() {
    super(IOType.TABLE, IOType.NONE);
  }

  async doExecute(
    table: Table,
    context: ExecutionContext,
  ): Promise<R.Result<R.None>> {
    const file = context.getPropertyValue(
      'file',
      context.valueTypeProvider.Primitives.Text,
    );
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

    const formatOptions: FormatterOptionsArgs<Row, Row> = {
      delimiter,
      quote: enclosing,
      escape: enclosingEscape,
      headers: getHeaders(table),
    };

    context.logger.logDebug(
      `Generating csv using delimiter '${formatOptions.delimiter}', enclosing '${formatOptions.quote}' and escape '${formatOptions.escape}'`,
    );
    const csv = await writeToCSVBuffer(toRows(table), formatOptions);

    context.logger.logDebug(`Writing csv to file ${file}`);
    await fsPromise.writeFile(file, csv);
    context.logger.logDebug(`The data was successfully written to ${file}`);

    return R.ok(R.NONE);
  }
}

function getHeaders(table: Table): string[] {
  return [...table.getColumns().keys()];
}

function toRows(table: Table): Row[] {
  const columns: InternalValueRepresentation[][] = [
    ...table.getColumns().entries(),
  ].map((column) => column[1].values);

  return transposeArray(columns);
}

function transposeArray<T>(array: T[][]): T[][] {
  if (array[0] === undefined) {
    return [];
  }
  return array[0]?.map((_, colIndex) =>
    array.map((row): T => {
      const cell = row[colIndex];
      assert(cell !== undefined);
      return cell;
    }),
  );
}
