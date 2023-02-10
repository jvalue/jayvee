import { strict as assert } from 'assert';

import {
  CellIndexBounds,
  CellRange,
  SemanticCell,
  SemanticCellRange,
  SemanticColumn,
  SemanticRow,
  Sheet,
  getCellIndex,
  getColumnIndex,
  getRowIndex,
} from '@jayvee/language-server';

export function clone(sheet: Sheet): Sheet {
  return structuredClone(sheet);
}

export function deleteRow(sheet: Sheet, row: SemanticRow): void {
  assert(isInBounds(sheet, row));

  row = resolveRelativeIndexes(sheet, row);
  const rowIndex = getRowIndex(row);

  sheet.data.splice(rowIndex, 1);
  sheet.height--;
}

export function deleteColumn(sheet: Sheet, column: SemanticColumn): void {
  assert(isInBounds(sheet, column));

  column = resolveRelativeIndexes(sheet, column);
  const columnIndex = getColumnIndex(column);

  sheet.data.forEach((row) => {
    row.splice(columnIndex, 1);
  });
  sheet.width--;
}

export function writeCell(
  sheet: Sheet,
  cell: SemanticCell,
  content: string,
): void {
  assert(isInBounds(sheet, cell));

  cell = resolveRelativeIndexes(sheet, cell);

  const cellIndex = getCellIndex(cell);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  sheet.data[cellIndex.rowIndex]![cellIndex.columnIndex] = content;
}

export function selectRange(sheet: Sheet, range: SemanticCellRange): void {
  assert(isInBounds(sheet, range));

  range = resolveRelativeIndexes(sheet, range);

  sheet.data = sheet.data.reduce<string[][]>((previous, row, rowIndex) => {
    if (rowIndex < range.from.rowIndex || range.to.rowIndex < rowIndex) {
      return previous;
    }
    return [
      ...previous,
      row.slice(range.from.columnIndex, range.to.columnIndex + 1),
    ];
  }, []);

  sheet.width = range.to.columnIndex - range.from.columnIndex + 1;
  sheet.height = range.to.rowIndex - range.from.rowIndex + 1;
}

export function isInBounds(sheet: Sheet, range: SemanticCellRange): boolean {
  const bounds = getSheetBounds(sheet);
  return range.isInBounds(bounds);
}

export function resolveRelativeIndexes<N extends CellRange>(
  sheet: Sheet,
  range: SemanticCellRange<N>,
): SemanticCellRange<N> {
  if (range.hasRelativeIndexes()) {
    const bounds = getSheetBounds(sheet);
    return range.resolveRelativeIndexes(bounds);
  }
  return range;
}

export function getSheetBounds(sheet: Sheet): CellIndexBounds {
  return {
    lastColumnIndex: sheet.width - 1,
    lastRowIndex: sheet.height - 1,
  };
}
