import * as R from '@jvalue/execution';
import { BlockExecutor, NONE, None, Table } from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';
import { Client } from 'pg';

export class PostgresLoaderExecutor extends BlockExecutor<
  IOType.TABLE,
  IOType.NONE
> {
  constructor() {
    super('PostgresLoader', IOType.TABLE, IOType.NONE);
  }

  override async execute(input: Table): Promise<R.Result<None>> {
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
      this.logger.logDebug(`Connecting to database`);
      await client.connect();

      this.logger.logDebug(`Dropping previous table "${table}" if it exists`);
      await client.query(Table.generateDropTableStatement(table));
      this.logger.logDebug(`Creating table "${table}"`);
      await client.query(input.generateCreateTableStatement(table));
      this.logger.logDebug(
        `Inserting ${input.getNumberOfRows()} row(s) into table "${table}"`,
      );
      await client.query(input.generateInsertValuesStatement(table));

      this.logger.logDebug(
        `The data was successfully loaded into the database`,
      );
      return R.ok(NONE);
    } catch (err: unknown) {
      return R.err({
        message: `Could not write to postgres database: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
        diagnostic: { node: this.block, property: 'name' },
      });
    } finally {
      await client.end();
    }
  }
}
