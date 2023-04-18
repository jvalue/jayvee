// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following eslint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ColumnLiteral } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';

export function validateColumnLiteral(
  column: ColumnLiteral,
  context: ValidationContext,
): void {
  checkColumnIdSyntax(column, context);
}

function checkColumnIdSyntax(
  column: ColumnLiteral,
  context: ValidationContext,
): void {
  if (column.columnId === undefined) {
    return;
  }

  const columnIdRegex = /^([A-Z]+|\*)$/;
  if (!columnIdRegex.test(column.columnId)) {
    context.accept(
      'error',
      'Columns need to be denoted via capital letters or the * character',
      {
        node: column,
        property: 'columnId',
      },
    );
  }
}
