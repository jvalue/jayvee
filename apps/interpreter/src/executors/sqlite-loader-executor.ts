import { Table } from '@jayvee/language-server';
import * as sqlite3 from 'sqlite3';

import { BlockExecutor } from './block-executor';
import * as R from './utils/execution-result';
import {
  buildCreateTableStatement,
  buildDropTableStatement,
  buildInsertValuesStatement,
} from './utils/sql-util';

export class SQLiteLoaderExecutor extends BlockExecutor<Table, void> {
  constructor() {
    super('SQLiteLoader');
  }

  override async execute(input: Table): Promise<R.Result<void>> {
    const file = this.getStringAttributeValue('file');
    const table = this.getStringAttributeValue('table');

    let db: sqlite3.Database | undefined;

    try {
      db = new sqlite3.Database(file);

      await this.runQuery(db, buildDropTableStatement(table));
      await this.runQuery(db, buildCreateTableStatement(table, input));
      await this.runQuery(db, buildInsertValuesStatement(table, input));

      return Promise.resolve(R.ok(undefined));
    } catch (err: unknown) {
      return Promise.resolve(
        R.err({
          message: 'Could not write to sqlite database.',
          hint: err instanceof Error ? err.message : JSON.stringify(err),
          cstNode: this.block.$cstNode?.parent,
        }),
      );
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
