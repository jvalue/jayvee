// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/working-with-the-ast for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { ColumnId } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';

export function validateColumnId(
  columnId: ColumnId,
  context: ValidationContext,
): void {
  checkColumnIdSyntax(columnId, context);
}

function checkColumnIdSyntax(
  columnId: ColumnId,
  context: ValidationContext,
): void {
  if (columnId?.value === undefined || columnId?.value === '*') {
    return;
  }

  const columnIdRegex = /^[A-Z]+$/;
  if (!columnIdRegex.test(columnId.value)) {
    context.accept(
      'error',
      'Columns need to be denoted via capital letters or the * character',
      {
        node: columnId,
        property: 'value',
      },
    );
  }
}
