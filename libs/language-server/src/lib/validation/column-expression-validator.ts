import { ValidationAcceptor, ValidationChecks } from 'langium';

import { ColumnExpression, JayveeAstType } from '../ast/generated/ast';

import { JayveeValidator } from './jayvee-validator';

export class ColumnExpressionValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      ColumnExpression: [this.checkColumnIdSyntax],
    };
  }

  checkColumnIdSyntax(
    this: void,
    columnExpression: ColumnExpression,
    accept: ValidationAcceptor,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (columnExpression.columnId === undefined) {
      return;
    }

    const columnIdRegex = /^([A-Z]+|\*)$/;
    if (!columnIdRegex.test(columnExpression.columnId)) {
      accept(
        'error',
        'Columns need to be denoted via capital letters or the * character',
        {
          node: columnExpression,
          property: 'columnId',
        },
      );
    }
  }
}
