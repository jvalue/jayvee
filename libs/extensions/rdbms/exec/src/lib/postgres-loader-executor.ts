import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Table } from '@jayvee/language-server';
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
      this.logger.logInfo(`Connecting to database`);
      await client.connect();

      this.logger.logInfo(`Dropping previous table "${table}" if it exists`);
      await client.query(buildDropTableStatement(table));
      this.logger.logInfo(`Creating table "${table}"`);
      await client.query(buildCreateTableStatement(table, input));
      this.logger.logInfo(
        `Inserting ${input.data.length} row(s) into table "${table}"`,
      );
      await client.query(buildInsertValuesStatement(table, input));

      this.logger.logInfo(`The data was successfully loaded into the database`);
      return Promise.resolve(R.ok(undefined));
    } catch (err: unknown) {
      return Promise.resolve(
        R.err({
          message: `Could not write to postgres database: ${
            err instanceof Error ? err.message : JSON.stringify(err)
          }`,
          diagnostic: { node: this.block, property: 'name' },
        }),
      );
    } finally {
      await client.end();
    }
  }
}
