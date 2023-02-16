import { BlockExecutor } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import { Table } from '@jayvee/language-server';
import * as sqlite3 from 'sqlite3';

import {
  buildCreateTableStatement,
  buildDropTableStatement,
  buildInsertValuesStatement,
} from './sql-util';

export class SQLiteLoaderExecutor extends BlockExecutor<Table, void> {
  constructor() {
    super('SQLiteLoader');
  }

  override async execute(input: Table): Promise<R.Result<void>> {
    const file = this.getStringAttributeValue('file');
    const table = this.getStringAttributeValue('table');

    let db: sqlite3.Database | undefined;

    try {
      this.logger.logDebug(`Opening database file ${file}`);
      db = new sqlite3.Database(file);

      this.logger.logDebug(`Dropping previous table "${table}" if it exists`);
      await this.runQuery(db, buildDropTableStatement(table));
      this.logger.logDebug(`Creating table "${table}"`);
      await this.runQuery(db, buildCreateTableStatement(table, input));
      this.logger.logDebug(
        `Inserting ${input.data.length} row(s) into table "${table}"`,
      );
      await this.runQuery(db, buildInsertValuesStatement(table, input));

      this.logger.logDebug(
        `The data was successfully loaded into the database`,
      );
      return R.ok(undefined);
    } catch (err: unknown) {
      return R.err({
        message: `Could not write to sqlite database: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
        diagnostic: { node: this.block, property: 'name' },
      });
    } finally {
      db?.close();
    }
  }

  private async runQuery(
    db: sqlite3.Database,
    query: string,
  ): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      db.run(query, (result: sqlite3.RunResult, error: Error | null) =>
        error ? reject(error) : resolve(result),
      );
    });
  }
}
