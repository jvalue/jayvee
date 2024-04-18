// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  NONE,
  type None,
  Table,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';
import { Client } from 'pg';

@implementsStatic<BlockExecutorClass>()
export class PostgresLoaderExecutor extends AbstractBlockExecutor<
  IOType.TABLE,
  IOType.NONE
> {
  public static readonly type = 'PostgresLoader';

  constructor() {
    super(IOType.TABLE, IOType.NONE);
  }

  async doExecute(
    input: Table,
    context: ExecutionContext,
  ): Promise<R.Result<None>> {
    const host = context.getPropertyValue(
      'host',
      context.valueTypeProvider.Primitives.Text,
    );
    const port = context.getPropertyValue(
      'port',
      context.valueTypeProvider.Primitives.Integer,
    );
    const user = context.getPropertyValue(
      'username',
      context.valueTypeProvider.Primitives.Text,
    );
    const password = context.getPropertyValue(
      'password',
      context.valueTypeProvider.Primitives.Text,
    );
    const database = context.getPropertyValue(
      'database',
      context.valueTypeProvider.Primitives.Text,
    );
    const table = context.getPropertyValue(
      'table',
      context.valueTypeProvider.Primitives.Text,
    );

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
