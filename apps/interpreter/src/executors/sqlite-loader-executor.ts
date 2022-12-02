import {
  AbstractDataType,
  SQLiteLoader,
  SQLiteLoaderMetaInformation,
  Table,
} from '@jayvee/language-server';
import * as sqlite3 from 'sqlite3';

import { getStringAttributeValue } from '../attribute-util';
import { SQLiteColumnTypeVisitor } from '../visitors/SQLiteColumnTypeVisitor';
import { SQLiteValueRepresentationVisitor } from '../visitors/SQLiteValueRepresentationVisitor';

import { BlockExecutor } from './block-executor';
import * as R from './execution-result';

export class SQLiteLoaderExecutor extends BlockExecutor<
  SQLiteLoader,
  Table,
  void,
  SQLiteLoaderMetaInformation
> {
  override async execute(input: Table): Promise<R.Result<void>> {
    const file = getStringAttributeValue(
      this.block.file.value,
      this.runtimeParameters,
    );

    const table = 'TODO';

    let db: sqlite3.Database | undefined;

    try {
      db = new sqlite3.Database(file);

      await this.runQuery(db, this.buildCreateTableStatement(table, input));
      await this.runQuery(db, this.buildInsertValuesStatement(table, input));

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
      db && db.close();
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

  private buildCreateTableStatement(tableName: string, input: Table): string {
    const columnTypeVisitor = new SQLiteColumnTypeVisitor();

    const columnStatements = input.columnNames
      .map((columnName) => columnName || 'EMPTYNAME')
      .map((columnName) => `"${columnName}"`)
      .map((name, index) => {
        return `${name} ${(
          input.columnTypes[index] as AbstractDataType
        ).acceptVisitor(columnTypeVisitor)}`;
      });

    return `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnStatements.join(
      ',',
    )});`;
  }

  private buildInsertValuesStatement(tableName: string, input: Table): string {
    const valueRepresenationVisitor = new SQLiteValueRepresentationVisitor();

    const valueRepresentationFormatters = input.columnTypes.map((type) => {
      return type?.acceptVisitor(valueRepresenationVisitor);
    });

    const valuesStatement = input.data
      .map((row) => {
        return `(${row
          .map((value, index) => valueRepresentationFormatters[index]?.(value))
          .join(',')})`;
      })
      .join(',');

    return `INSERT INTO "${tableName}" (${input.columnNames
      .map((columnName) => columnName || 'EMPTYNAME')
      .map((columnName) => `"${columnName}"`)
      .join(',')}) VALUES ${valuesStatement}`;
  }
}
