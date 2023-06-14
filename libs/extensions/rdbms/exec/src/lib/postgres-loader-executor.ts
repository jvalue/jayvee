// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  NONE,
  None,
  Table,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType, PrimitiveValuetypes } from '@jvalue/jayvee-language-server';
import { Client } from 'pg';

@implementsStatic<BlockExecutorClass>()
export class PostgresLoaderExecutor
  implements BlockExecutor<IOType.TABLE, IOType.NONE>
{
  public static readonly type = 'PostgresLoader';
  public readonly inputType = IOType.TABLE;
  public readonly outputType = IOType.NONE;

  async execute(
    input: Table,
    context: ExecutionContext,
  ): Promise<R.Result<None>> {
    const host = context.getPropertyValue('host', PrimitiveValuetypes.Text);
    const port = context.getPropertyValue('port', PrimitiveValuetypes.Integer);
    const user = context.getPropertyValue('username', PrimitiveValuetypes.Text);
    const password = context.getPropertyValue(
      'password',
      PrimitiveValuetypes.Text,
    );
    const database = context.getPropertyValue(
      'database',
      PrimitiveValuetypes.Text,
    );
    const table = context.getPropertyValue('table', PrimitiveValuetypes.Text);

    const client = new Client({
      host,
      port,
      user,
      password,
      database,
    });

    try {
      context.logger.logDebug(`Connecting to database`);
      await client.connect();

      context.logger.logDebug(
        `Dropping previous table "${table}" if it exists`,
      );
      await client.query(Table.generateDropTableStatement(table));
      context.logger.logDebug(`Creating table "${table}"`);
      await client.query(input.generateCreateTableStatement(table));
      context.logger.logDebug(
        `Inserting ${input.getNumberOfRows()} row(s) into table "${table}"`,
      );
      await client.query(input.generateInsertValuesStatement(table));

      context.logger.logDebug(
        `The data was successfully loaded into the database`,
      );
      return R.ok(NONE);
    } catch (err: unknown) {
      return R.err({
        message: `Could not write to postgres database: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
        diagnostic: { node: context.getCurrentNode(), property: 'name' },
      });
    } finally {
      await client.end();
    }
  }
}
