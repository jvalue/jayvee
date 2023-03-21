/**
 * See the FAQ section of README.md for an explanation why the following eslint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ValidationAcceptor, ValidationChecks } from 'langium';

import { JayveeAstType, RangeLiteral } from '../../ast/generated/ast';
import { CellRangeWrapper } from '../../ast/wrappers/cell-range-wrapper';
import { JayveeValidator } from '../jayvee-validator';

export class CellRangeSelectionValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      RangeLiteral: [this.checkRangeLimits],
    };
  }

  checkRangeLimits(
    this: void,
    rangeExpression: RangeLiteral,
    accept: ValidationAcceptor,
  ): void {
    if (
      rangeExpression.cellFrom === undefined ||
      rangeExpression.cellTo === undefined
    ) {
      return;
    }
    const semanticCellRange = new CellRangeWrapper(rangeExpression);
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
}
