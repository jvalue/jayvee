// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  IOType,
  type InternalValueRepresentation,
  type ValueType,
} from '@jvalue/jayvee-language-server';

import { SQLColumnTypeVisitor } from '../value-types/visitors/sql-column-type-visitor';
import { SQLValueRepresentationVisitor } from '../value-types/visitors/sql-value-representation-visitor';

import {
  type IOTypeImplementation,
  type IoTypeVisitor,
} from './io-type-implementation';

export interface TableColumn<
  T extends InternalValueRepresentation = InternalValueRepresentation,
> {
  values: T[];
  valueType: ValueType;
}

export type TableRow = Record<string, InternalValueRepresentation>;

/**
 * Invariant: the shape of the table is always a rectangle.
 * This means all columns must have the same size.
 */
export class Table implements IOTypeImplementation<IOType.TABLE> {
  public readonly ioType = IOType.TABLE;

  private numberOfRows = 0;

  private columns = new Map<string, TableColumn>();

  public constructor(numberOfRows = 0) {
    this.numberOfRows = numberOfRows;
  }

  addColumn(name: string, column: TableColumn): void {
    assert(column.values.length === this.numberOfRows);
    this.columns.set(name, column);
  }

  /**
   * Tries to add a new row to this table.
   * NOTE: This method will only add the row if the table has at least one column!
   * @param row data of this row for each column
   */
  addRow(row: TableRow): void {
    const rowLength = Object.keys(row).length;
    assert(
      rowLength === this.columns.size,
      `Added row has the wrong dimension (expected: ${this.columns.size}, actual: ${rowLength})`,
    );
    if (rowLength === 0) {
      return;
    }
    assert(
      Object.keys(row).every((x) => this.hasColumn(x)),
      'Added row does not fit the columns in the table',
    );

    Object.entries(row).forEach(([columnName, value]) => {
      const column = this.columns.get(columnName);
      assert(column !== undefined);

      assert(column.valueType.isInternalValueRepresentation(value));
      column.values.push(value);
    });

    this.numberOfRows++;
  }

  dropRow(rowId: number): void {
    assert(rowId < this.numberOfRows);

    this.columns.forEach((column) => {
      column.values.splice(rowId, 1);
    });

    this.numberOfRows--;
  }

  dropRows(rowIds: number[]): void {
    rowIds
      .sort((a, b) => b - a) // delete descending to avoid messing up row indices
      .forEach((rowId) => {
        this.dropRow(rowId);
      });
  }

  getNumberOfRows(): number {
    return this.numberOfRows;
  }

  getNumberOfColumns(): number {
    return this.columns.size;
  }

  hasColumn(name: string): boolean {
    return this.columns.has(name);
  }

  getColumns(): ReadonlyMap<string, TableColumn> {
    return this.columns;
  }

  getColumn(name: string): TableColumn | undefined {
    return this.columns.get(name);
  }

  getRow(rowId: number): Map<string, InternalValueRepresentation> {
    const numberOfRows = this.getNumberOfRows();
    if (rowId >= numberOfRows) {
      throw new Error(
        `Trying to access table row ${rowId} (of ${numberOfRows} rows)`,
      );
    }

    const row = new Map<string, InternalValueRepresentation>();
    [...this.columns.entries()].forEach(([columnName, column]) => {
      const value = column.values[rowId];
      assert(value !== undefined);
      row.set(columnName, value);
    });
    return row;
  }

  static generateDropTableStatement(tableName: string): string {
    return `DROP TABLE IF EXISTS "${tableName}";`;
  }

  generateInsertValuesStatement(tableName: string): string {
    const valueRepresentationVisitor = new SQLValueRepresentationVisitor();

    const columnNames = [...this.columns.keys()];
    const formattedRowValues: string[] = [];
    for (let rowIndex = 0; rowIndex < this.numberOfRows; ++rowIndex) {
      const rowValues: string[] = [];
      for (const columnName of columnNames) {
        const column = this.columns.get(columnName);
        const entry = column?.values[rowIndex];
        assert(entry !== undefined);
        const formattedValue = column?.valueType.acceptVisitor(
          valueRepresentationVisitor,
        )(entry);
        assert(formattedValue !== undefined);
        rowValues.push(formattedValue);
      }
      formattedRowValues.push(`(${rowValues.join(',')})`);
    }

    const formattedColumns = columnNames.map((c) => `"${c}"`).join(',');

    return `INSERT INTO "${tableName}" (${formattedColumns}) VALUES ${formattedRowValues.join(
      ', ',
    )}`;
  }

  generateCreateTableStatement(tableName: string): string {
    const columnTypeVisitor = new SQLColumnTypeVisitor();

    const columns = [...this.columns.entries()];
    const columnStatements = columns.map(([columnName, column]) => {
      return `"${columnName}" ${column.valueType.acceptVisitor(
        columnTypeVisitor,
      )}`;
    });

    return `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnStatements.join(
      ',',
    )});`;
  }

  clone(): Table {
    const cloned = new Table();
    cloned.numberOfRows = this.numberOfRows;
    [...this.columns.entries()].forEach(([columnName, column]) => {
      cloned.addColumn(columnName, {
        values: structuredClone(column.values),
        valueType: column.valueType,
      });
    });

    return cloned;
  }

  acceptVisitor<R>(visitor: IoTypeVisitor<R>): R {
    return visitor.visitTable(this);
  }
}
