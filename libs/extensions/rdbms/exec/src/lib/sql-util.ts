import { Table } from '@jayvee/language-server';

import { SQLColumnTypeVisitor } from './visitors/SQLColumnTypeVisitor';
import { SQLValueRepresentationVisitor } from './visitors/SQLValueRepresentationVisitor';

export function buildDropTableStatement(tableName: string): string {
  return `DROP TABLE IF EXISTS "${tableName}";`;
}

export function buildInsertValuesStatement(
  tableName: string,
  table: Table,
): string {
  const valueRepresentationVisitor = new SQLValueRepresentationVisitor();

  const valueRepresentationFormatters = table.columnMetas.map((columnMeta) =>
    columnMeta.columnType.acceptVisitor(valueRepresentationVisitor),
  );

  const valuesStatement = table.data
    .map((row) => {
      return `(${row
        .map((value, index) => valueRepresentationFormatters[index]?.(value))
        .join(',')})`;
    })
    .join(',');

  return `INSERT INTO "${tableName}" (${table.columnMetas
    .map((columnMeta) => `"${columnMeta.columnName}"`)
    .join(',')}) VALUES ${valuesStatement}`;
}

export function buildCreateTableStatement(
  tableName: string,
  table: Table,
): string {
  const columnTypeVisitor = new SQLColumnTypeVisitor();

  const columnStatements = table.columnMetas.map((columnMeta) => {
    return `"${columnMeta.columnName}" ${columnMeta.columnType.acceptVisitor(
      columnTypeVisitor,
    )}`;
  });

  return `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnStatements.join(
    ',',
  )});`;
}
