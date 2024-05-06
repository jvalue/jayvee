// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  isCellLiteral,
  isColumnLiteral,
  isRangeLiteral,
  isRowLiteral,
} from '../../generated/ast';
import {
  CellRangeWrapper,
  type CellWrapper,
  type ColumnWrapper,
  type RowWrapper,
} from '../cell-range-wrapper';

import { type CellIndex, LAST_INDEX } from './cell-index';

export function isCellRangeWrapper(obj: unknown): obj is CellRangeWrapper {
  return obj instanceof CellRangeWrapper;
}

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
