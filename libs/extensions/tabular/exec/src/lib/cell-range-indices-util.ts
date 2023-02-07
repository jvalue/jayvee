import { CellRangeIndices, LAST_INDEX, Sheet } from '@jayvee/language-server';

export function cellRangeIndicesFitSheet(
  indices: CellRangeIndices,
  sheet: Sheet,
): boolean {
  if (sheet.width === 0 || sheet.height === 0) {
    return false;
  }
  const replacedIndices = replaceLastIndex(indices, sheet);
  for (const cellIndex of [replacedIndices.from, replacedIndices.to]) {
    if (cellIndex.row >= sheet.height) {
      return false;
    }
    if (cellIndex.column >= sheet.width) {
      return false;
    }
  }
  return true;
}

export function replaceLastIndex(
  indices: CellRangeIndices,
  sheet: Sheet,
): CellRangeIndices {
  return {
    from: {
      column:
        indices.from.column === LAST_INDEX
          ? sheet.width - 1
          : indices.from.column,
      row:
        indices.from.row === LAST_INDEX ? sheet.height - 1 : indices.from.row,
    },
    to: {
      column:
        indices.to.column === LAST_INDEX ? sheet.width - 1 : indices.to.column,
      row: indices.to.row === LAST_INDEX ? sheet.height - 1 : indices.to.row,
    },
  };
}
