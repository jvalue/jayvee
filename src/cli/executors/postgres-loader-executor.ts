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

  override executeFn(input: Table): R.ResultTask<void> {
    const columnTypeVisitor = new PostgresColumnTypeVisitor();
    const valueRepresenationVisitor = new PostgresValueRepresentationVisitor();

    const valueRepresentationFormatters = input.columnTypes.map((type) => {
      return type?.acceptVisitor(valueRepresenationVisitor);
    });

    const tableName = this.block.$container.name;

    const columnPostgresStatements = input.columnNames.map((name, index) => {
      return `${name} ${(
        input.columnTypes[index] as AbstractDataType
      ).acceptVisitor(columnTypeVisitor)}`;
    });

    const createTableStatement = `CREATE TABLE ${tableName} (${columnPostgresStatements.join(
      ',',
    )});`;

    const valuesStatement = input.data
      .map((row) => {
        return `(${row
          .map((value, index) => valueRepresentationFormatters[index]?.(value))
          .join(',')})`;
      })
      .join(',');

    console.log(createTableStatement);
    console.log(
      `INSERT INTO ${tableName} (${input.columnNames.join(
        ',',
      )}) VALUES ${valuesStatement}`,
    );

    return () => Promise.resolve(R.ok(undefined));
  }
}
