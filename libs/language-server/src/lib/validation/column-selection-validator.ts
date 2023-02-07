import { ValidationAcceptor, ValidationChecks } from 'langium';

import { ColumnSelection, JayveeAstType } from '../ast/generated/ast';

import { JayveeValidator } from './jayvee-validator';

export class ColumnSelectionValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      ColumnSelection: [this.checkColumnIdSyntax],
    };
  }

  checkColumnIdSyntax(
    this: void,
    columnSelection: ColumnSelection,
    accept: ValidationAcceptor,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (columnSelection.columnId === undefined) {
      return;
    }

    const columnIdRegex = /^([A-Z]+|\*)$/;
    if (!columnIdRegex.test(columnSelection.columnId)) {
      accept(
        'error',
        'Columns need to be denoted via capital letters or the * character',
        {
          node: columnSelection,
          property: 'columnId',
        },
      );
    }
  }
}
