import {
  AbstractDataType,
  PostgresLoader,
  PostgresLoaderMetaInformation,
  Table,
} from '@jayvee/language-server';
import { Client } from 'pg';

import {
  getIntAttributeValue,
  getStringAttributeValue,
} from '../attribute-util';
import { PostgresColumnTypeVisitor } from '../visitors/PostgresColumnTypeVisitor';
import { PostgresValueRepresentationVisitor } from '../visitors/PostgresValueRepresentationVisitor';

import { BlockExecutor } from './block-executor';
import * as R from './execution-result';

export class PostgresLoaderExecutor extends BlockExecutor<
  PostgresLoader,
  Table,
  void,
  PostgresLoaderMetaInformation
> {
  override async execute(input: Table): Promise<R.Result<void>> {
    const clientResult = this.createPgClient();
    if (R.isErr(clientResult)) {
      return clientResult;
    }
    const client = R.okData(clientResult);

    const table = getStringAttributeValue(
      this.block.table.value,
      this.runtimeParameters,
    );

    try {
      await client.connect();

      await client.query(this.buildCreateTableStatement(table, input));

      await client.query(this.buildInsertValuesStatement(table, input));

      return Promise.resolve(R.ok(undefined));
    } catch (err: unknown) {
      return Promise.resolve(
        R.err({
          message: 'Could not write to postgres database.',
          hint: err instanceof Error ? err.message : JSON.stringify(err),
          cstNode: this.block.$cstNode?.parent,
        }),
      );
    } finally {
      await client.end();
    }
  }

  private buildCreateTableStatement(tableName: string, input: Table): string {
    const columnTypeVisitor = new PostgresColumnTypeVisitor();

    const columnPostgresStatements = input.columnNames
      .map((columnName) => columnName)
      .map((columnName) => `"${columnName}"`)
      .map((name, index) => {
        return `${name} ${(
          input.columnTypes[index] as AbstractDataType
        ).acceptVisitor(columnTypeVisitor)}`;
      });

    return `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnPostgresStatements.join(
      ',',
    )});`;
  }

  private buildInsertValuesStatement(tableName: string, input: Table): string {
    const valueRepresenationVisitor = new PostgresValueRepresentationVisitor();

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
      .map((columnName) => columnName)
      .map((columnName) => `"${columnName}"`)
      .join(',')}) VALUES ${valuesStatement}`;
  }

  private createPgClient(): R.Result<Client> {
    const host = getStringAttributeValue(
      this.block.host.value,
      this.runtimeParameters,
    );

    const port = getIntAttributeValue(
      this.block.port.value,
      this.runtimeParameters,
    );

    const user = getStringAttributeValue(
      this.block.username.value,
      this.runtimeParameters,
    );

    const password = getStringAttributeValue(
      this.block.password.value,
      this.runtimeParameters,
    );

    const database = getStringAttributeValue(
      this.block.database.value,
      this.runtimeParameters,
    );

    return R.ok(
      new Client({
        host,
        port,
        user,
        password,
        database,
      }),
    );
  }
}
