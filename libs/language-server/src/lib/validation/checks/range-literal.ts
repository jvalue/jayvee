// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { RangeLiteral } from '../../ast/generated/ast';
import { CellRangeWrapper } from '../../ast/wrappers/cell-range-wrapper';
import { ValidationContext } from '../validation-context';

export function validateRangeLiteral(
  range: RangeLiteral,
  context: ValidationContext,
): void {
  if (!CellRangeWrapper.canBeWrapped(range)) {
    return;
  }
  const wrappedRange = new CellRangeWrapper(range);
  checkRangeLimits(wrappedRange, context);
}

function checkRangeLimits(
  range: CellRangeWrapper,
  context: ValidationContext,
): void {
  if (
    range.from.columnIndex > range.to.columnIndex ||
    range.from.rowIndex > range.to.rowIndex
  ) {
    context.accept(
      'error',
      `Cell ranges need to be spanned from top-left to bottom-right`,
      {
        node: range.astNode,
      },
    );
  }
}
