// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  CellLiteral,
  CellRangeLiteral,
  ColumnLiteral,
  RangeLiteral,
  RowLiteral,
  isCellLiteral,
  isColumnLiteral,
  isRangeLiteral,
  isRowLiteral,
} from '../generated/ast';

import { AstNodeWrapper } from './ast-node-wrapper';
import {
  columnCharactersAsIndex,
  columnIndexAsCharacters,
} from './util/column-id-util';

export const LAST_INDEX = Number.POSITIVE_INFINITY;

export class CellIndex {
  constructor(
    public readonly columnIndex: number,
    public readonly rowIndex: number,
  ) {}

  toString(): string {
    return `${columnIndexToString(this.columnIndex)}${rowIndexToString(
      this.rowIndex,
    )}`;
  }

  hasRelativeIndexes(): boolean {
    return this.columnIndex === LAST_INDEX || this.rowIndex === LAST_INDEX;
  }

  resolveRelativeIndexes(bounds: CellIndexBounds): CellIndex {
    let columnIndex = this.columnIndex;
    if (columnIndex === LAST_INDEX) {
      columnIndex = bounds.lastColumnIndex;
    }
    let rowIndex = this.rowIndex;
    if (rowIndex === LAST_INDEX) {
      rowIndex = bounds.lastRowIndex;
    }
    return new CellIndex(columnIndex, rowIndex);
  }

  isInBounds(bounds: CellIndexBounds): boolean {
    const columnInBounds = this.isIndexInBounds(
      this.columnIndex,
      bounds.lastColumnIndex,
    );
    const rowInBounds = this.isIndexInBounds(
      this.rowIndex,
      bounds.lastRowIndex,
    );

    return columnInBounds && rowInBounds;
  }

  private isIndexInBounds(index: number, max: number): boolean {
    if (max < 0) {
      return false;
    }
    return index === LAST_INDEX || index <= max;
  }
}

export function columnIndexToString(columnIndex: number): string {
  if (columnIndex === LAST_INDEX) {
    return '*';
  }
  return columnIndexAsCharacters(columnIndex);
}

export function rowIndexToString(rowIndex: number): string {
  if (rowIndex === LAST_INDEX) {
    return '*';
  }
  return `${rowIndex + 1}`;
}

export interface CellIndexBounds {
  lastColumnIndex: number;
  lastRowIndex: number;
}

export class CellRangeWrapper<N extends CellRangeLiteral = CellRangeLiteral>
  implements AstNodeWrapper<N>
{
  public readonly astNode: N;
  public readonly from: CellIndex;
  public readonly to: CellIndex;

  constructor(cellRange: N, indexes?: { from: CellIndex; to: CellIndex }) {
    this.astNode = cellRange;

    if (indexes !== undefined) {
      this.from = indexes.from;
      this.to = indexes.to;
    } else if (isCellLiteral(cellRange)) {
      const cellIndex = parseCellId(cellRange.cellId);
      this.from = cellIndex;
      this.to = cellIndex;
    } else if (isColumnLiteral(cellRange)) {
      const columnIndex = parseColumnId(cellRange.columnId);
      this.from = new CellIndex(columnIndex, 0);
      this.to = new CellIndex(columnIndex, LAST_INDEX);
    } else if (isRowLiteral(cellRange)) {
      const rowIndex = parseRowId(cellRange.rowId);
      this.from = new CellIndex(0, rowIndex);
      this.to = new CellIndex(LAST_INDEX, rowIndex);
    } else {
      this.from = parseCellId(cellRange.cellFrom);
      this.to = parseCellId(cellRange.cellTo);
    }
  }

  static canBeWrapped(cellRange: CellRangeLiteral): boolean {
    if (isCellLiteral(cellRange)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return cellRange.cellId !== undefined;
    } else if (isColumnLiteral(cellRange)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return cellRange.columnId !== undefined;
    } else if (isRowLiteral(cellRange)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return cellRange.rowId !== undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return cellRange.cellFrom !== undefined && cellRange.cellTo !== undefined;
  }

  isInBounds(bounds: CellIndexBounds): boolean {
    return this.from.isInBounds(bounds) && this.to.isInBounds(bounds);
  }

  resolveRelativeIndexes(bounds: CellIndexBounds): CellRangeWrapper<N> {
    const boundFrom = this.from.resolveRelativeIndexes(bounds);
    const boundTo = this.to.resolveRelativeIndexes(bounds);
    return new CellRangeWrapper<N>(this.astNode, {
      from: boundFrom,
      to: boundTo,
    });
  }

  hasRelativeIndexes(): boolean {
    return this.from.hasRelativeIndexes() || this.to.hasRelativeIndexes();
  }

  toString(): string {
    return `${this.from.toString()}:${this.to.toString()}`;
  }
}

export type ColumnWrapper = CellRangeWrapper<ColumnLiteral | RangeLiteral>;

export function isColumnWrapper(
  cellRange: CellRangeWrapper,
): cellRange is ColumnWrapper {
  if (isColumnLiteral(cellRange.astNode)) {
    return true;
  }
  if (isRangeLiteral(cellRange.astNode)) {
    return (
      cellRange.from.columnIndex === cellRange.to.columnIndex &&
      cellRange.from.rowIndex === 0 &&
      cellRange.to.rowIndex === LAST_INDEX
    );
  }
  return false;
}

export function getColumnIndex(column: ColumnWrapper): number {
  assert(isColumnWrapper(column));
  return column.from.columnIndex;
}

export type RowWrapper = CellRangeWrapper<RowLiteral | RangeLiteral>;

export function isRowWrapper(
  cellRange: CellRangeWrapper,
): cellRange is RowWrapper {
  if (isRowLiteral(cellRange.astNode)) {
    return true;
  }
  if (isRangeLiteral(cellRange.astNode)) {
    return (
      cellRange.from.rowIndex === cellRange.to.rowIndex &&
      cellRange.from.columnIndex === 0 &&
      cellRange.to.columnIndex === LAST_INDEX
    );
  }
  return false;
}

export function getRowIndex(row: RowWrapper): number {
  assert(isRowWrapper(row));
  return row.from.rowIndex;
}

export type CellWrapper = CellRangeWrapper<CellLiteral | RangeLiteral>;

export function isCellWrapper(
  cellRange: CellRangeWrapper,
): cellRange is CellWrapper {
  if (isCellLiteral(cellRange.astNode)) {
    return true;
  }
  if (isRangeLiteral(cellRange.astNode)) {
    return (
      cellRange.from.columnIndex === cellRange.to.columnIndex &&
      cellRange.from.rowIndex === cellRange.to.rowIndex
    );
  }
  return false;
}

export function getCellIndex(cell: CellWrapper): CellIndex {
  assert(isCellWrapper(cell));
  return cell.from;
}

const CELL_INDEX_REGEX = /([A-Z]+|\*)([0-9]+|\*)/;

function parseCellId(cellId: string): CellIndex {
  const matches = CELL_INDEX_REGEX.exec(cellId) || [];
  const columnId = matches[1];
  const rowId = matches[2];

  assert(
    columnId !== undefined && rowId !== undefined,
    `Cell IDs are expected to match the regular expression ${CELL_INDEX_REGEX.toString()}`,
  );

  const columnIndex = parseColumnId(columnId);
  const rowIndex = parseRowId(rowId);

  return new CellIndex(columnIndex, rowIndex);
}

function parseColumnId(columnId: string): number {
  if (columnId === '*') {
    return LAST_INDEX;
  }
  return columnCharactersAsIndex(columnId);
}

function parseRowId(rowId: string | number): number {
  if (typeof rowId === 'string') {
    if (rowId === '*') {
      return LAST_INDEX;
    }
    return Number.parseInt(rowId, 10) - 1;
  }
  return rowId - 1;
}
