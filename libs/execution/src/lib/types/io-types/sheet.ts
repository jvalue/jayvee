import { strict as assert } from 'assert';

import {
  CellIndexBounds,
  CellRangeLiteral,
  CellRangeWrapper,
  CellWrapper,
  ColumnWrapper,
  IOType,
  RowWrapper,
  getCellIndex,
  getColumnIndex,
  getRowIndex,
} from '@jvalue/language-server';

import { IOTypeImplementation } from './io-type-implementation';

export class Sheet implements IOTypeImplementation<IOType.SHEET> {
  public readonly ioType = IOType.SHEET;
  private numberOfRows: number;
  private numberOfColumns: number;
  constructor(private data: string[][]) {
    this.numberOfRows = data.length;
    this.numberOfColumns = data.reduce((prev, curr) => {
      return curr.length > prev ? curr.length : prev;
    }, 0);
  }

  getNumberOfRows(): number {
    return this.numberOfRows;
  }

  getNumberOfColumns(): number {
    return this.numberOfColumns;
  }

  getHeaderRow(): string[] {
    assert(
      this.getNumberOfRows() > 0,
      'The sheet is expected to be non-empty and have a header row',
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.data[0]!;
  }

  iterateRows(callbackFn: (row: string[], rowIndex: number) => void) {
    this.data.forEach(callbackFn);
  }

  clone(): Sheet {
    return new Sheet(structuredClone(this.data));
  }

  deleteRow(row: RowWrapper): void {
    assert(this.isInBounds(row));

    row = this.resolveRelativeIndexes(row);
    const rowIndex = getRowIndex(row);

    this.data.splice(rowIndex, 1);
    this.numberOfRows--;
  }

  deleteColumn(column: ColumnWrapper): void {
    assert(this.isInBounds(column));

    column = this.resolveRelativeIndexes(column);
    const columnIndex = getColumnIndex(column);

    this.data.forEach((row) => {
      row.splice(columnIndex, 1);
    });
    this.numberOfColumns--;
  }

  writeCell(cell: CellWrapper, content: string): void {
    assert(this.isInBounds(cell));

    cell = this.resolveRelativeIndexes(cell);

    const cellIndex = getCellIndex(cell);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.data[cellIndex.rowIndex]![cellIndex.columnIndex] = content;
  }

  selectRange(range: CellRangeWrapper): void {
    assert(this.isInBounds(range));

    range = this.resolveRelativeIndexes(range);

    this.data = this.data.reduce<string[][]>((previous, row, rowIndex) => {
      if (rowIndex < range.from.rowIndex || range.to.rowIndex < rowIndex) {
        return previous;
      }
      return [
        ...previous,
        row.slice(range.from.columnIndex, range.to.columnIndex + 1),
      ];
    }, []);

    this.numberOfColumns = range.to.columnIndex - range.from.columnIndex + 1;
    this.numberOfRows = range.to.rowIndex - range.from.rowIndex + 1;
  }

  isInBounds(range: CellRangeWrapper): boolean {
    const bounds = this.getBounds();
    return range.isInBounds(bounds);
  }

  resolveRelativeIndexes<N extends CellRangeLiteral>(
    range: CellRangeWrapper<N>,
  ): CellRangeWrapper<N> {
    if (range.hasRelativeIndexes()) {
      const bounds = this.getBounds();
      return range.resolveRelativeIndexes(bounds);
    }
    return range;
  }

  private getBounds(): CellIndexBounds {
    return {
      lastColumnIndex: this.numberOfColumns - 1,
      lastRowIndex: this.numberOfRows - 1,
    };
  }
}
