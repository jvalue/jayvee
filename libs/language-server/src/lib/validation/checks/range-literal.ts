// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following eslint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ValidationAcceptor } from 'langium';

import { RangeLiteral } from '../../ast/generated/ast';
import { CellRangeWrapper } from '../../ast/wrappers/cell-range-wrapper';

export function validateRangeLiteral(
  range: RangeLiteral,
  accept: ValidationAcceptor,
): void {
  checkRangeLimits(range, accept);
}

function checkRangeLimits(
  range: RangeLiteral,
  accept: ValidationAcceptor,
): void {
  if (range.cellFrom === undefined || range.cellTo === undefined) {
    return;
  }
  const semanticCellRange = new CellRangeWrapper(range);
  if (
    semanticCellRange.from.columnIndex > semanticCellRange.to.columnIndex ||
    semanticCellRange.from.rowIndex > semanticCellRange.to.rowIndex
  ) {
    accept(
      'error',
      `Cell ranges need to be spanned from top-left to bottom-right`,
      {
        node: semanticCellRange.astNode,
      },
    );
  }
}
