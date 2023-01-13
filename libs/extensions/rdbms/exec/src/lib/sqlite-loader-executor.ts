import { BlockExecutor } from '@jayvee/execution';
import { Table } from '@jayvee/language-server';
import * as O from 'fp-ts/Option';
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

  override async execute(input: Table): Promise<O.Option<void>> {
    const file = this.getStringAttributeValue('file');
    const table = this.getStringAttributeValue('table');

    let db: sqlite3.Database | undefined;

    try {
      db = new sqlite3.Database(file);

      await this.runQuery(db, buildDropTableStatement(table));
      await this.runQuery(db, buildCreateTableStatement(table, input));
      await this.runQuery(db, buildInsertValuesStatement(table, input));

      return Promise.resolve(O.some(undefined));
    } catch (err: unknown) {
      this.logErr(
        `Could not write to sqlite database: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
        { node: this.block },
      );
      return Promise.resolve(O.none);
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
