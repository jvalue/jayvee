// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import {
  type CellLiteral,
  type CellRangeLiteral,
  type CellReference,
  type ColumnId,
  type ColumnLiteral,
  type RangeLiteral,
  type RowId,
  type RowLiteral,
  isCellLiteral,
  isCellReference,
  isColumnLiteral,
  isRangeLiteral,
  isRowLiteral,
} from '../generated/ast';

import { type AstNodeWrapper } from './ast-node-wrapper';
import { CellIndex, type CellIndexBounds, LAST_INDEX } from './util/cell-index';
import { columnCharactersAsIndex } from './util/column-id-util';

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
      const cellIndex = parseCellReference(cellRange.cellId);
      this.from = cellIndex;
      this.to = cellIndex;
    } else if (isColumnLiteral(cellRange)) {
      const columnIndex = parseColumnId(cellRange.columnId.value);
      this.from = new CellIndex(columnIndex, 0);
      this.to = new CellIndex(columnIndex, LAST_INDEX);
    } else if (isRowLiteral(cellRange)) {
      const rowIndex = parseRowId(cellRange.rowId.value);
      this.from = new CellIndex(0, rowIndex);
      this.to = new CellIndex(LAST_INDEX, rowIndex);
    } else {
      this.from = parseCellReference(cellRange.cellFrom);
      this.to = parseCellReference(cellRange.cellTo);
    }
  }

  static canBeWrapped(cellRange: CellRangeLiteral): boolean {
    if (isCellLiteral(cellRange)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return isCompleteCellReference(cellRange?.cellId);
    } else if (isColumnLiteral(cellRange)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return isCompleteColumnId(cellRange?.columnId);
    } else if (isRowLiteral(cellRange)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return isCompleteRowId(cellRange?.rowId);
    } else if (isRangeLiteral(cellRange)) {
      return (
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        isCompleteCellReference(cellRange?.cellFrom) &&
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        isCompleteCellReference(cellRange?.cellTo)
      );
    }
    assertUnreachable(cellRange);
  }

  isOneDimensional(): boolean {
    return (
      this.from.columnIndex === this.to.columnIndex ||
      this.from.rowIndex === this.to.rowIndex
    );
  }

  numberOfCells(): number {
    const numberOfRows = this.getNumberOfRows();
    const numberOfColumns = this.getNumberOfColumns();

    return numberOfRows * numberOfColumns;
  }

  private getNumberOfRows(): number {
    if (this.from.rowIndex === LAST_INDEX && this.to.rowIndex === LAST_INDEX) {
      return 1;
    }
    return this.to.rowIndex - this.from.rowIndex + 1;
  }

  private getNumberOfColumns(): number {
    if (
      this.from.columnIndex === LAST_INDEX &&
      this.to.columnIndex === LAST_INDEX
    ) {
      return 1;
    }
    return this.to.columnIndex - this.from.columnIndex + 1;
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
export type RowWrapper = CellRangeWrapper<RowLiteral | RangeLiteral>;
export type CellWrapper = CellRangeWrapper<CellLiteral | RangeLiteral>;

function isCompleteCellReference(
  cellReference: string | CellReference | undefined,
): boolean {
  if (isCellReference(cellReference)) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      isCompleteColumnId(cellReference?.columnId) &&
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      isCompleteRowId(cellReference?.rowId)
    );
  }
  return cellReference !== undefined;
}

function isCompleteColumnId(columnId: ColumnId | undefined) {
  return columnId?.value !== undefined;
}

function isCompleteRowId(rowId: RowId | undefined) {
  return rowId?.value !== undefined;
}

function parseCellReference(cellReference: string | CellReference): CellIndex {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  let columnId: string | '*';
  let rowId: number | '*';
  if (typeof cellReference === 'string') {
    const parseResult = parseStringCellReference(cellReference);
    columnId = parseResult.columnId;
    rowId = parseResult.rowId;
  } else {
    columnId = cellReference.columnId.value;
    rowId = cellReference.rowId.value;
  }

  const columnIndex = parseColumnId(columnId);
  const rowIndex = parseRowId(rowId);
  return new CellIndex(columnIndex, rowIndex);
}

const CELL_REFERENCE_REGEX = /([A-Z]+)([0-9]+)/;

function parseStringCellReference(cellReference: string): {
  columnId: string;
  rowId: number;
} {
  const matches = CELL_REFERENCE_REGEX.exec(cellReference) || [];
  const columnIdMatch = matches[1];
  const rowIdMatch = matches[2];

  assert(
    columnIdMatch !== undefined && rowIdMatch !== undefined,
    `Cell IDs are expected to match the regular expression ${CELL_REFERENCE_REGEX.toString()}`,
  );

  return {
    columnId: columnIdMatch,
    rowId: Number.parseInt(rowIdMatch, 10),
  };
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
function parseColumnId(columnId: string | '*'): number {
  if (columnId === '*') {
    return LAST_INDEX;
  }
  return columnCharactersAsIndex(columnId);
}

function parseRowId(rowId: number | '*'): number {
  if (rowId === '*') {
    return LAST_INDEX;
  }
  return rowId - 1;
}
