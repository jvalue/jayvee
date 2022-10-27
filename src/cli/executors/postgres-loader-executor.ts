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

  override executeFn(input: Table): Promise<R.Result<void>> {
    return async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const client = new Client({
        connectionString: 'postgresql://postgres:@localhost:5432/jvalue',
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      await client.connect();

      const columnTypeVisitor = new PostgresColumnTypeVisitor();
      const valueRepresenationVisitor =
        new PostgresValueRepresentationVisitor();

      const valueRepresentationFormatters = input.columnTypes.map((type) => {
        return type?.acceptVisitor(valueRepresenationVisitor);
      });

      const tableName = this.block.$container.name;

      const columnPostgresStatements = input.columnNames
        .map((x) => x || 'EMPTYNAME')
        .map((name, index) => {
          return `${name} ${(
            input.columnTypes[index] as AbstractDataType
          ).acceptVisitor(columnTypeVisitor)}`;
        });

      const createTableStatement = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnPostgresStatements.join(
        ',',
      )});`;

      const valuesStatement = input.data
        .map((row) => {
          return `(${row
            .map((value, index) =>
              valueRepresentationFormatters[index]?.(value),
            )
            .join(',')})`;
        })
        .join(',');

      const insertValuesStatement = `INSERT INTO ${tableName} (${input.columnNames
        .map((x) => x || 'EMPTYNAME')
        .join(',')}) VALUES ${valuesStatement}`;

      console.log(createTableStatement);
      console.log(insertValuesStatement);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      await client.query(createTableStatement);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      await client.query(insertValuesStatement);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      await client.end();

      return Promise.resolve(R.ok(undefined));
    };
  }
}
