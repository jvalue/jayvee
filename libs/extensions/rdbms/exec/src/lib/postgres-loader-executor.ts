import { BlockExecutor } from '@jayvee/execution';
import { Table } from '@jayvee/language-server';
import * as O from 'fp-ts/Option';
import { Client } from 'pg';

import {
  buildCreateTableStatement,
  buildDropTableStatement,
  buildInsertValuesStatement,
} from './sql-util';

export class PostgresLoaderExecutor extends BlockExecutor<Table, void> {
  constructor() {
    super('PostgresLoader');
  }

  override async execute(input: Table): Promise<O.Option<void>> {
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

      return Promise.resolve(O.some(undefined));
    } catch (err: unknown) {
      this.logErr(
        `Could not write to postgres database: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
        { node: this.block },
      );
      return Promise.resolve(O.none);
    } finally {
      await client.end();
    }
  }
}
