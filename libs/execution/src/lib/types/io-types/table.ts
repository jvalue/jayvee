// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType, Valuetype } from '@jvalue/jayvee-language-server';

import { SQLColumnTypeVisitor } from '../../visitors/sql-column-type-visitor';
import { SQLValueRepresentationVisitor } from '../../visitors/sql-value-representation-visitor';

import { IOTypeImplementation } from './io-type-implementation';

export class Table implements IOTypeImplementation<IOType.TABLE> {
  public readonly ioType = IOType.TABLE;

  private numberOfRows: number;
  private numberOfColumns: number;

  constructor(
    private readonly columnInformation: ColumnInformation[],
    private readonly data: string[][],
  ) {
    this.numberOfRows = data.length;
    this.numberOfColumns = columnInformation.length;
  }

  getNumberOfRows(): number {
    return this.numberOfRows;
  }

  getNumberOfColumns(): number {
    return this.numberOfColumns;
  }

  static generateDropTableStatement(tableName: string): string {
    return `DROP TABLE IF EXISTS "${tableName}";`;
  }

  generateInsertValuesStatement(tableName: string): string {
    const valueRepresentationVisitor = new SQLValueRepresentationVisitor();

    const valueRepresentationFormatters = this.columnInformation.map(
      (columnInformation) =>
        columnInformation.type.acceptVisitor(valueRepresentationVisitor),
    );

    const valuesStatement = this.data
      .map((row) => {
        return `(${row
          .map((value, index) => valueRepresentationFormatters[index]?.(value))
          .join(',')})`;
      })
      .join(',');

    return `INSERT INTO "${tableName}" (${this.columnInformation
      .map((columnInformation) => `"${columnInformation.name}"`)
      .join(',')}) VALUES ${valuesStatement}`;
  }

  generateCreateTableStatement(tableName: string): string {
    const columnTypeVisitor = new SQLColumnTypeVisitor();

    const columnStatements = this.columnInformation.map((columnInformation) => {
      return `"${
        columnInformation.name
      }" ${columnInformation.type.acceptVisitor(columnTypeVisitor)}`;
    });

    return `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnStatements.join(
      ',',
    )});`;
  }
}

export interface ColumnInformation {
  name: string;
  type: Valuetype;
}
