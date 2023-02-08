import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium/lib/utils/errors';

import { columnCharactersAsIndex } from './column-id-util';
import {
  CellRange,
  isCellRangeSelection,
  isCellSelection,
  isColumnSelection,
  isRowSelection,
} from './generated/ast';

export const LAST_INDEX = Number.POSITIVE_INFINITY;

export interface CellRangeIndices {
  from: CellIndex;
  to: CellIndex;
}

export interface CellIndex {
  column: number;
  row: number;
}

export function affectsEntireColumn(indices: CellRangeIndices): boolean {
  const affectsSingleColumn = indices.from.column === indices.to.column;
  const affectsAllRows =
    indices.from.row === 0 && indices.to.row === LAST_INDEX;

  return affectsSingleColumn && affectsAllRows;
}

export function affectsEntireRow(indices: CellRangeIndices): boolean {
  const affectsSingleRow = indices.from.row === indices.to.row;
  const affectsAllColumns =
    indices.from.column === 0 && indices.to.column === LAST_INDEX;

  return affectsSingleRow && affectsAllColumns;
}

export function affectsSingleCell(indices: CellRangeIndices): boolean {
  return (
    indices.from.column === indices.to.column &&
    indices.from.row === indices.to.row
  );
}

export function convertToIndices(
  cellRange: CellRange,
): CellRangeIndices | undefined {
  if (isColumnSelection(cellRange)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (cellRange.columnId === undefined) {
      return undefined;
    }

    const columnId = cellRange.columnId;
    const columnIndex = parseColumnId(columnId);
    return {
      from: {
        column: columnIndex,
        row: 0,
      },
      to: {
        column: columnIndex,
        row: LAST_INDEX,
      },
    };
  }
  if (isRowSelection(cellRange)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (cellRange.rowId === undefined) {
      return undefined;
    }

    const rowId = cellRange.rowId;
    const rowIndex = parseRowId(rowId);
    return {
      from: {
        column: 0,
        row: rowIndex,
      },
      to: {
        column: LAST_INDEX,
        row: rowIndex,
      },
    };
  }
  if (isCellSelection(cellRange)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (cellRange.cellId === undefined) {
      return undefined;
    }

    const cellIndex = convertToCellIndex(cellRange.cellId);
    return {
      from: cellIndex,
      to: cellIndex,
    };
  }
  if (isCellRangeSelection(cellRange)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (cellRange.cellFrom === undefined || cellRange.cellTo === undefined) {
      return undefined;
    }

    const cellFromIndex = convertToCellIndex(cellRange.cellFrom);
    const cellToIndex = convertToCellIndex(cellRange.cellTo);
    return {
      from: cellFromIndex,
      to: cellToIndex,
    };
  }
  assertUnreachable(cellRange);
}

function convertToCellIndex(cellId: string): CellIndex {
  const cellIndexRegex = /([A-Z]+|\*)([0-9]+|\*)/;
  const matches = cellIndexRegex.exec(cellId) || [];
  const columnId = matches[1];
  const rowId = matches[2];

  assert(
    columnId !== undefined && rowId !== undefined,
    `Cell IDs are expected to match the regular expression ${cellIndexRegex.toString()}`,
  );

  return {
    column: parseColumnId(columnId),
    row: parseRowId(rowId),
  };
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
