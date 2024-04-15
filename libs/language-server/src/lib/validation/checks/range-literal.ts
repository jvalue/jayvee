// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type RangeLiteral } from '../../ast/generated/ast';
import { CellRangeWrapper } from '../../ast/wrappers/cell-range-wrapper';
import { type JayveeValidationProps } from '../validation-registry';

export function validateRangeLiteral(
  range: RangeLiteral,
  props: JayveeValidationProps,
): void {
  if (!CellRangeWrapper.canBeWrapped(range)) {
    return;
  }
  const wrappedRange = new CellRangeWrapper(range);
  checkRangeLimits(wrappedRange, props);
}

function checkRangeLimits(
  range: CellRangeWrapper,
  props: JayveeValidationProps,
): void {
  if (
    range.from.columnIndex > range.to.columnIndex ||
    range.from.rowIndex > range.to.rowIndex
  ) {
    props.validationContext.accept(
      'error',
      `Cell ranges need to be spanned from top-left to bottom-right`,
      {
        node: range.astNode,
      },
    );
  }
}
