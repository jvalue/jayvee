import { Client } from 'pg';

import { PostgresLoader } from '../../language-server/generated/ast';
import { Table, tableType, undefinedType } from '../data-types';
import { AbstractDataType } from '../datatypes/AbstractDataType';
import { PostgresColumnTypeVisitor } from '../datatypes/visitors/PostgresColumnTypeVisitor';
import { PostgresValueRepresentationVisitor } from '../datatypes/visitors/PostgresValueRepresentationVisitor';

import { BlockExecutor } from './block-executor';
import * as R from './execution-result';

export class PostgresLoaderExecutor extends BlockExecutor<
  PostgresLoader,
  Table,
  void
> {
  constructor(block: PostgresLoader) {
    super(block, tableType, undefinedType);
  }

  override async execute(input: Table): Promise<R.Result<void>> {
    const client = new Client({
      connectionString: 'postgresql://postgres:@localhost:5432/jvalue',
    });

    await client.connect();

    await client.query(
      this.buildCreateTableStatement(this.block.$container.name, input),
    );

    await client.query(
      this.buildInsertValuesStatement(this.block.$container.name, input),
    );

    await client.end();

    return Promise.resolve(R.ok(undefined));
  }

  private buildCreateTableStatement(tableName: string, input: Table): string {
    const columnTypeVisitor = new PostgresColumnTypeVisitor();

    const columnPostgresStatements = input.columnNames
      .map((x) => x || 'EMPTYNAME')
      .map((name, index) => {
        return `${name} ${(
          input.columnTypes[index] as AbstractDataType
        ).acceptVisitor(columnTypeVisitor)}`;
      });

    return `CREATE TABLE IF NOT EXISTS ${tableName} (${columnPostgresStatements.join(
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

    return `INSERT INTO ${tableName} (${input.columnNames
      .map((x) => x || 'EMPTYNAME')
      .join(',')}) VALUES ${valuesStatement}`;
  }
}
