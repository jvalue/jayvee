import * as R from '@jvalue/execution';
import {
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  NONE,
  None,
  Table,
  implementsStatic,
} from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';
import * as sqlite3 from 'sqlite3';

@implementsStatic<BlockExecutorClass>()
export class SQLiteLoaderExecutor
  implements BlockExecutor<IOType.TABLE, IOType.NONE>
{
  public static readonly type = 'SQLiteLoader';
  public readonly inputType = IOType.TABLE;
  public readonly outputType = IOType.NONE;

  async execute(
    input: Table,
    context: ExecutionContext,
  ): Promise<R.Result<None>> {
    const file = context.getTextAttributeValue('file');
    const table = context.getTextAttributeValue('table');

    let db: sqlite3.Database | undefined;

    try {
      context.logger.logDebug(`Opening database file ${file}`);
      db = new sqlite3.Database(file);

      context.logger.logDebug(
        `Dropping previous table "${table}" if it exists`,
      );
      await this.runQuery(db, Table.generateDropTableStatement(table));
      context.logger.logDebug(`Creating table "${table}"`);
      await this.runQuery(db, input.generateCreateTableStatement(table));
      context.logger.logDebug(
        `Inserting ${input.getNumberOfRows()} row(s) into table "${table}"`,
      );
      await this.runQuery(db, input.generateInsertValuesStatement(table));

      context.logger.logDebug(
        `The data was successfully loaded into the database`,
      );
      return R.ok(NONE);
    } catch (err: unknown) {
      return R.err({
        message: `Could not write to sqlite database: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
        diagnostic: { node: context.getCurrentNode(), property: 'name' },
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
