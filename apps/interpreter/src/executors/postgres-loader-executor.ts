import { Table } from '@jayvee/language-server';
import { Client } from 'pg';

import { BlockExecutor } from './block-executor';
import * as R from './execution-result';
import {
  buildCreateTableStatement,
  buildDropTableStatement,
  buildInsertValuesStatement,
} from './sql-util';

export class PostgresLoaderExecutor extends BlockExecutor<Table, void> {
  constructor() {
    super('PostgresLoader');
  }

  override async execute(input: Table): Promise<R.Result<void>> {
    const host = this.getStringAttributeValue('host');
    const port = this.getIntAttributeValue('port');
    const user = this.getStringAttributeValue('username');
    const password = this.getStringAttributeValue('password');
    const database = this.getStringAttributeValue('database');
    const table = this.getStringAttributeValue('table');

    const client = new Client({
      host,
      port,
      user,
      password,
      database,
    });

    try {
      await client.connect();

      await client.query(buildDropTableStatement(table));
      await client.query(buildCreateTableStatement(table, input));
      await client.query(buildInsertValuesStatement(table, input));

      return Promise.resolve(R.ok(undefined));
    } catch (err: unknown) {
      return Promise.resolve(
        R.err({
          message: 'Could not write to postgres database.',
          hint: err instanceof Error ? err.message : JSON.stringify(err),
          cstNode: this.block.$cstNode?.parent,
        }),
      );
    } finally {
      await client.end();
    }
  }
}
