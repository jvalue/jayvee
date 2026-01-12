// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import {
  ERROR_TYPEGUARD,
  InvalidValue,
  IOType,
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  type TextValuetype,
  type ValueType,
  cloneInternalValue,
} from '@jvalue/jayvee-language-server';

import { SQLColumnTypeVisitor } from '../value-types/visitors/sql-column-type-visitor';
import { SQLValueRepresentationVisitor } from '../value-types/visitors/sql-value-representation-visitor';

import {
  type IOTypeImplementation,
  type IoTypeVisitor,
} from './io-type-implementation';
import { ConstraintExecutor } from '../../constraints';
import { type ExecutionContext } from '../../execution-context';
import { assertUnreachable } from 'langium';

export interface TableColumn<
  T extends InternalValidValueRepresentation = InternalValidValueRepresentation,
> {
  values: (T | InternalErrorValueRepresentation)[];
  valueType: ValueType;
}

export type TableRow = Map<
  string,
  InternalValidValueRepresentation | InternalErrorValueRepresentation
>;

/**
 * Invariant: the shape of the table is always a rectangle.
 * This means all columns must have the same size.
 */
export class Table implements IOTypeImplementation<IOType.TABLE> {
  public readonly ioType = IOType.TABLE;

  public constructor(
    private numberOfRows: number,
    private columns: Map<string, TableColumn>,
    private constraintExecutors: ConstraintExecutor[],
  ) {
    assert(this.numberOfRows !== undefined);
    assert(this.columns !== undefined);
    assert(this.constraintExecutors !== undefined);
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
  addRow(
    row: Record<
      string,
      InternalValidValueRepresentation | InternalErrorValueRepresentation
    >,
  ): void;
  addRow(row: TableRow): void;
  addRow(
    row:
      | TableRow
      | Record<
          string,
          InternalValidValueRepresentation | InternalErrorValueRepresentation
        >,
  ): void {
    const rowLength = row instanceof Map ? row.size : Object.keys(row).length;
    assert(
      rowLength === this.columns.size,
      `Added row has the wrong dimension (expected: ${this.columns.size}, actual: ${rowLength})`,
    );

    if (rowLength > 0) {
      this.numberOfRows++;
    }

    const rowValues =
      row instanceof Map ? [...row.entries()] : Object.entries(row);

    for (const [columnName, cellValue] of rowValues) {
      const column = this.columns.get(columnName);
      assert(column !== undefined, 'All added rows fit columns in the table');

      assert(
        ERROR_TYPEGUARD(cellValue) ||
          column.valueType.isInternalValidValueRepresentation(cellValue),
      );
      column.values.push(cellValue);
    }
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

  getColumns(): Map<string, TableColumn> {
    return this.columns;
  }

  getColumn(name: string): TableColumn | undefined {
    return this.columns.get(name);
  }

  getRow(rowId: number): TableRow | undefined {
    const numberOfRows = this.getNumberOfRows();
    if (rowId >= numberOfRows) {
      return undefined;
    }

    const row = new Map<
      string,
      InternalValidValueRepresentation | InternalErrorValueRepresentation
    >();
    [...this.columns.entries()].forEach(([columnName, column]) => {
      const value = column.values[rowId];
      assert(value !== undefined);
      row.set(columnName, value);
    });
    return row;
  }

  private setRowInvalid(rowIdx: number, message: string): void {
    for (const [columnName, column] of this.columns.entries()) {
      column.values[rowIdx] = new InvalidValue(message);
      this.columns.set(columnName, column);
    }
  }

  forEachUnfulfilledRow(
    onInvalidRow: (
      constraint: ConstraintExecutor,
      rowIndex: number,
      row: TableRow,
    ) => 'markInvalid' | 'ignore',
    executionContext: ExecutionContext,
  ): void {
    for (let rowIdx = 0; rowIdx < this.numberOfRows; rowIdx++) {
      const row = this.getRow(rowIdx);
      assert(row !== undefined);

      for (const constraint of this.constraintExecutors) {
        if (constraint.isValid(row, executionContext)) {
          continue;
        }
        const invalidHandling = onInvalidRow(constraint, rowIdx, row);
        switch (invalidHandling) {
          case 'markInvalid': {
            this.setRowInvalid(rowIdx, `Invalid constraint ${constraint.name}`);
            break;
          }
          case 'ignore': {
            break;
          }
          default: {
            assertUnreachable(invalidHandling);
          }
        }
      }
    }
  }

  static generateDropTableStatement(tableName: string): string {
    return `DROP TABLE IF EXISTS "${tableName}";`;
  }

  generateInsertValuesStatement(
    tableName: string,
    text: TextValuetype,
  ): string {
    const valueRepresentationVisitor = new SQLValueRepresentationVisitor();

    const columns = [...this.columns.entries()];
    const formattedRowValues: string[] = [];
    for (let rowIndex = 0; rowIndex < this.numberOfRows; ++rowIndex) {
      const rowValues: string[] = [];
      for (const [, column] of columns) {
        const entry = column.values[rowIndex];
        assert(entry !== undefined);
        const formattedValue = column.valueType.acceptVisitor(
          valueRepresentationVisitor,
        )(entry);
        rowValues.push(formattedValue);
      }
      formattedRowValues.push(`(${rowValues.join(',')})`);
    }

    const formattedColumns = columns
      .map(([colName]) => {
        return text.acceptVisitor(valueRepresentationVisitor)(colName);
      })
      .join(',');

    return `INSERT INTO "${tableName}" (${formattedColumns}) VALUES ${formattedRowValues.join(
      ', ',
    )}`;
  }

  generateCreateTableStatement(tableName: string, text: TextValuetype): string {
    const columnTypeVisitor = new SQLColumnTypeVisitor();
    const valueRepresentationVisitor = new SQLValueRepresentationVisitor();

    const columns = [...this.columns.entries()];
    const columnStatements = columns.map(([columnName, column]) => {
      return `${text.acceptVisitor(valueRepresentationVisitor)(
        columnName,
      )} ${column.valueType.acceptVisitor(columnTypeVisitor)}`;
    });

    return `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnStatements.join(
      ',',
    )});`;
  }

  clone(): Table {
    const copiedColumns = new Map<string, TableColumn>();
    [...this.columns.entries()].map(([columnName, column]) => {
      copiedColumns.set(columnName, {
        values: cloneInternalValue(column.values),
        valueType: column.valueType,
      });
    });

    const copiedConstraints = this.constraintExecutors.map(
      (constraint) => new ConstraintExecutor(constraint.astNode),
    );

    return new Table(this.numberOfRows, copiedColumns, copiedConstraints);
  }

  acceptVisitor<R>(visitor: IoTypeVisitor<R>): R {
    return visitor.visitTable(this);
  }
}
