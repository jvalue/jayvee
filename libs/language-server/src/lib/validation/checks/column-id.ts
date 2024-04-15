// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { type ColumnId } from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validateColumnId(
  columnId: ColumnId,
  props: JayveeValidationProps,
): void {
  checkColumnIdSyntax(columnId, props);
}

function checkColumnIdSyntax(
  columnId: ColumnId,
  props: JayveeValidationProps,
): void {
  if (columnId?.value === undefined || columnId?.value === '*') {
    return;
  }

  const columnIdRegex = /^[A-Z]+$/;
  if (!columnIdRegex.test(columnId.value)) {
    props.validationContext.accept(
      'error',
      'Columns need to be denoted via capital letters or the * character',
      {
        node: columnId,
        property: 'value',
      },
    );
  }
}
