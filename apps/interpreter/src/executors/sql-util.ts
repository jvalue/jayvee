import { AbstractDataType, Table } from '@jayvee/language-server';

import { SQLColumnTypeVisitor } from '../visitors/SQLColumnTypeVisitor';
import { SQLValueRepresentationVisitor } from '../visitors/SQLValueRepresentationVisitor';

export function buildDropTableStatement(tableName: string): string {
  return `DROP TABLE IF EXISTS "${tableName}";`;
}

export function buildInsertValuesStatement(
  tableName: string,
  input: Table,
): string {
  const valueRepresenationVisitor = new SQLValueRepresentationVisitor();

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
    .map((columnName) => `"${columnName}"`)
    .join(',')}) VALUES ${valuesStatement}`;
}

export function buildCreateTableStatement(
  tableName: string,
  input: Table,
): string {
  const columnTypeVisitor = new SQLColumnTypeVisitor();

  const columnPostgresStatements = input.columnNames
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
