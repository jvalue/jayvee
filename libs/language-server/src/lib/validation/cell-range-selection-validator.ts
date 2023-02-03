import { ValidationAcceptor, ValidationChecks } from 'langium';

import { convertToIndices } from '../ast/cell-range-util';
import { CellRangeSelection, JayveeAstType } from '../ast/generated/ast';

import { JayveeValidator } from './jayvee-validator';

export class CellRangeSelectionValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      CellRangeSelection: [this.checkRangeLimits],
    };
  }

  checkRangeLimits(
    this: void,
    cellRangeSelection: CellRangeSelection,
    accept: ValidationAcceptor,
  ): void {
    const indices = convertToIndices(cellRangeSelection);
    if (indices === undefined) {
      return;
    }

    if (
      indices.from.column > indices.to.column ||
      indices.from.row > indices.to.row
    ) {
      accept(
        'error',
        `Cell ranges need to be spanned from top-left to bottom-right`,
        {
          node: cellRangeSelection,
        },
      );
    }
  }
}
