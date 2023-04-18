// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationAcceptor } from 'langium';

import {
  BooleanExpression,
  isBooleanExpression,
  isBooleanLiteral,
} from '../../ast/generated/ast';
import {
  PropertyValuetype,
  evaluateExpression,
  inferTypesFromValue,
} from '../../ast/model-util';

export function validateExpression(
  expression: BooleanExpression,
  accept: ValidationAcceptor,
): void {
  checkSimplification(expression, accept);
}

function checkSimplification(
  expression: BooleanExpression,
  accept: ValidationAcceptor,
): void {
  if (isBooleanLiteral(expression)) {
    return;
  }
  if (isBooleanExpression(expression.$container)) {
    return;
  }
  if (!inferTypesFromValue(expression).includes(PropertyValuetype.BOOLEAN)) {
    return;
  }

  const evaluatedExpression = evaluateExpression(expression);
  accept(
    'info',
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `The expression can be simplified to ${evaluatedExpression}`,
    { node: expression },
  );
}
