import { strict as assert } from 'assert';

import {
  CellExpression,
  CellRange,
  ColumnExpression,
  RangeExpression,
  RowExpression,
  isCellExpression,
  isColumnExpression,
  isRangeExpression,
  isRowExpression,
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

export class SemanticCellRange<N extends CellRange = CellRange>
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
    } else if (isCellExpression(cellRange)) {
      const cellIndex = parseCellId(cellRange.cellId);
      this.from = cellIndex;
      this.to = cellIndex;
    } else if (isColumnExpression(cellRange)) {
      const columnIndex = parseColumnId(cellRange.columnId);
      this.from = new CellIndex(columnIndex, 0);
      this.to = new CellIndex(columnIndex, LAST_INDEX);
    } else if (isRowExpression(cellRange)) {
      const rowIndex = parseRowId(cellRange.rowId);
      this.from = new CellIndex(0, rowIndex);
      this.to = new CellIndex(LAST_INDEX, rowIndex);
    } else {
      this.from = parseCellId(cellRange.cellFrom);
      this.to = parseCellId(cellRange.cellTo);
    }
  }

  static canBeWrapped(cellRange: CellRange): boolean {
    if (isCellExpression(cellRange)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return cellRange.cellId !== undefined;
    } else if (isColumnExpression(cellRange)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return cellRange.columnId !== undefined;
    } else if (isRowExpression(cellRange)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return cellRange.rowId !== undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return cellRange.cellFrom !== undefined && cellRange.cellTo !== undefined;
  }

  isInBounds(bounds: CellIndexBounds): boolean {
    return this.from.isInBounds(bounds) && this.to.isInBounds(bounds);
  }

  resolveRelativeIndexes(bounds: CellIndexBounds): SemanticCellRange<N> {
    const boundFrom = this.from.resolveRelativeIndexes(bounds);
    const boundTo = this.to.resolveRelativeIndexes(bounds);
    return new SemanticCellRange<N>(this.astNode, {
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

export type SemanticColumn = SemanticCellRange<
  ColumnExpression | RangeExpression
>;

export function isSemanticColumn(
  cellRange: SemanticCellRange,
): cellRange is SemanticColumn {
  if (isColumnExpression(cellRange.astNode)) {
    return true;
  }
  if (isRangeExpression(cellRange.astNode)) {
    return (
      cellRange.from.columnIndex === cellRange.to.columnIndex &&
      cellRange.from.rowIndex === 0 &&
      cellRange.to.rowIndex === LAST_INDEX
    );
  }
  return false;
}

export function getColumnIndex(column: SemanticColumn): number {
  assert(isSemanticColumn(column));
  return column.from.columnIndex;
}

export type SemanticRow = SemanticCellRange<RowExpression | RangeExpression>;

export function isSemanticRow(
  cellRange: SemanticCellRange,
): cellRange is SemanticRow {
  if (isRowExpression(cellRange.astNode)) {
    return true;
  }
  if (isRangeExpression(cellRange.astNode)) {
    return (
      cellRange.from.rowIndex === cellRange.to.rowIndex &&
      cellRange.from.columnIndex === 0 &&
      cellRange.to.columnIndex === LAST_INDEX
    );
  }
  return false;
}

export function getRowIndex(row: SemanticRow): number {
  assert(isSemanticRow(row));
  return row.from.rowIndex;
}

export type SemanticCell = SemanticCellRange<CellExpression | RangeExpression>;

export function isSemanticCell(
  cellRange: SemanticCellRange,
): cellRange is SemanticCell {
  if (isCellExpression(cellRange.astNode)) {
    return true;
  }
  if (isRangeExpression(cellRange.astNode)) {
    return (
      cellRange.from.columnIndex === cellRange.to.columnIndex &&
      cellRange.from.rowIndex === cellRange.to.rowIndex
    );
  }
  return false;
}

export function getCellIndex(cell: SemanticCell): CellIndex {
  assert(isSemanticCell(cell));
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
