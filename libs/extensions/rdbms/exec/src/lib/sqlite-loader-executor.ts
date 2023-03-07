import * as R from '@jvalue/execution';
import { BlockExecutor, NONE, None, Table } from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';
import * as sqlite3 from 'sqlite3';

export class SQLiteLoaderExecutor extends BlockExecutor<
  IOType.TABLE,
  IOType.NONE
> {
  constructor() {
    super('SQLiteLoader', IOType.TABLE, IOType.NONE);
  }

  override async execute(input: Table): Promise<R.Result<None>> {
    const file = this.getStringAttributeValue('file');
    const table = this.getStringAttributeValue('table');

    let db: sqlite3.Database | undefined;

    try {
      this.logger.logDebug(`Opening database file ${file}`);
      db = new sqlite3.Database(file);

      this.logger.logDebug(`Dropping previous table "${table}" if it exists`);
      await this.runQuery(db, Table.generateDropTableStatement(table));
      this.logger.logDebug(`Creating table "${table}"`);
      await this.runQuery(db, input.generateCreateTableStatement(table));
      this.logger.logDebug(
        `Inserting ${input.getNumberOfRows()} row(s) into table "${table}"`,
      );
      await this.runQuery(db, input.generateInsertValuesStatement(table));

      this.logger.logDebug(
        `The data was successfully loaded into the database`,
      );
      return R.ok(NONE);
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
