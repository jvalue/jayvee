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
import pg from 'pg';

const { Client } = pg; // work around import issue with ESM

@implementsStatic<BlockExecutorClass>()
export class PostgresLoaderExecutor extends AbstractBlockExecutor<
  IOType.TABLE,
  IOType.NONE
> {
  public static readonly type = 'PostgresLoader';

  constructor() {
    super(IOType.TABLE, IOType.NONE);
  }

  private createClient(context: ExecutionContext) {
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
    return new Client({
      host,
      port,
      user,
      password,
      database,
    });
  }

  private createError(
    message: string,
    error: unknown,
    context: ExecutionContext,
  ): R.Result<None> {
    return R.err({
      message:
        message +
        ': ' +
        (error instanceof Error ? error.message : JSON.stringify(error)),
      diagnostic: { node: context.getCurrentNode(), property: 'name' },
    });
  }

  private async connectToDB(
    client: pg.Client,
    context: ExecutionContext,
  ): Promise<R.Result<None> | undefined> {
    context.logger.logDebug(`Connecting to database`);
    try {
      await client.connect();
    } catch (error) {
      return this.createError(
        `Could not connect to postgres database`,
        error,
        context,
      );
    }
    return undefined;
  }

  private async dropTable(
    client: pg.Client,
    table: string,
    context: ExecutionContext,
  ): Promise<R.Result<None> | undefined> {
    context.logger.logDebug(`Dropping previous table "${table}" if it exists`);
    const dropTableStatement = Table.generateDropTableStatement(table);
    try {
      await client.query(dropTableStatement);
    } catch (err) {
      return this.createError(
        `Could not drop table ${table} from postgres database`,
        err,
        context,
      );
    }
    return undefined;
  }
  private async createTable(
    client: pg.Client,
    table: string,
    input: Table,
    context: ExecutionContext,
  ): Promise<R.Result<None> | undefined> {
    context.logger.logDebug(`Creating table "${table}"`);
    const createTableStatement = input.generateCreateTableStatement(
      table,
      context.valueTypeProvider.Primitives.Text,
    );
    try {
      await client.query(createTableStatement);
    } catch (err) {
      return this.createError(
        `Could not create table ${table} in postgres database`,
        err,
        context,
      );
    }
    return undefined;
  }

  private async insertValues(
    client: pg.Client,
    table: string,
    input: Table,
    context: ExecutionContext,
  ): Promise<R.Result<None> | undefined> {
    context.logger.logDebug(
      `Inserting ${input.getNumberOfRows()} row(s) into table "${table}"`,
    );
    const insertValuesStatement = input.generateInsertValuesStatement(
      table,
      context.valueTypeProvider.Primitives.Text,
    );
    try {
      await client.query(insertValuesStatement);
    } catch (err) {
      return this.createError(
        `Could not write to postgres database`,
        err,
        context,
      );
    }
    return undefined;
  }

  async doExecute(
    input: Table,
    context: ExecutionContext,
  ): Promise<R.Result<None>> {
    const table = context.getPropertyValue(
      'table',
      context.valueTypeProvider.Primitives.Text,
    );

    const client = this.createClient(context);

    const result =
      (await this.connectToDB(client, context)) ??
      (await this.dropTable(client, table, context)) ??
      (await this.createTable(client, table, input, context)) ??
      (await this.insertValues(client, table, input, context));
    await client.end();
    if (result !== undefined) {
      return result;
    }

    context.logger.logDebug(
      `The data was successfully loaded into the database`,
    );
    return R.ok(NONE);
  }
}
