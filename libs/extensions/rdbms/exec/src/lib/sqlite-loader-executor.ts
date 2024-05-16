// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  NONE,
  type None,
  type Table,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';
import sqlite3 from 'sqlite3';

@implementsStatic<BlockExecutorClass>()
export class SQLiteLoaderExecutor extends AbstractBlockExecutor<
  IOType.TABLE,
  IOType.NONE
> {
  public static readonly type = 'SQLiteLoader';

  constructor() {
    super(IOType.TABLE, IOType.NONE);
  }

  async doExecute(
    input: Table,
    context: ExecutionContext,
  ): Promise<R.Result<None>> {
    const file = context.getPropertyValue(
      'file',
      context.valueTypeProvider.Primitives.Text,
    );
    const table = context.getPropertyValue(
      'table',
      context.valueTypeProvider.Primitives.Text,
    );
    const dropTable = context.getPropertyValue(
      'dropTable',
      context.valueTypeProvider.Primitives.Boolean,
    );

    let db: sqlite3.Database | undefined;

    try {
      context.logger.logDebug(`Opening database file ${file}`);
      db = new sqlite3.Database(file);

      if (dropTable) {
        context.logger.logDebug(
          `Dropping previous table "${table}" if it exists`,
        );
        await this.runQuery(db, 'DROP TABLE IF EXISTS ?', [table]);
      }

      context.logger.logDebug(`Creating table "${table}"`);
      const sqlCreateTableParams = input.generateSqlColumnMap().reduce(
        ({ parameters, values }, { name, type }) => ({
          parameters: parameters.concat('? ?'),
          values: values.concat(`${name} ${type}`),
        }),
        { parameters: [] as string[], values: [] as string[] },
      );
      await this.runQuery(
        db,
        `CREATE TABLE IF NOT EXISTS ? (${sqlCreateTableParams.parameters.join(
          ',',
        )})`,
        [table, ...sqlCreateTableParams.values],
      );
      context.logger.logDebug(
        `Inserting ${input.getNumberOfRows()} row(s) into table "${table}"`,
      );
      const sqlInsertQueryParams = input.generateSqlInsertValues();
      const nValues = sqlInsertQueryParams.columnNames.length;
      const queryParamColumns = `(${new Array(nValues).fill('? ').join(', ')})`;
      const queryParamValue = new Array(nValues)
        .fill(queryParamColumns)
        .join(', ');
      await this.runQuery(
        db,
        `INSERT INTO ? ${queryParamColumns} VALUES ${queryParamValue}`,
      );

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
    params?: unknown[] | Record<string, unknown>,
  ): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      db.run(query, params, (result: sqlite3.RunResult, error: Error | null) =>
        error ? reject(error) : resolve(result),
      );
    });
  }
}
