// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { columnIndexAsCharacters } from './column-id-util';

export const LAST_INDEX = Number.MAX_SAFE_INTEGER;

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
