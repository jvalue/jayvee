import { ValidationAcceptor, ValidationChecks } from 'langium';

import { JayveeAstType, RangeExpression } from '../ast/generated/ast';
import { SemanticCellRange } from '../ast/wrappers/semantic-cell-range';

import { JayveeValidator } from './jayvee-validator';

export class CellRangeSelectionValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      RangeExpression: [this.checkRangeLimits],
    };
  }

  checkRangeLimits(
    this: void,
    rangeExpression: RangeExpression,
    accept: ValidationAcceptor,
  ): void {
    if (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      rangeExpression.cellFrom === undefined ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      rangeExpression.cellTo === undefined
    ) {
      return;
    }
    const semanticCellRange = new SemanticCellRange(rangeExpression);
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
