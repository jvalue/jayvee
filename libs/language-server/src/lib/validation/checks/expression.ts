// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

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
import { ValidationContext } from '../validation-context';

export function validateExpression(
  expression: BooleanExpression,
  context: ValidationContext,
): void {
  checkSimplification(expression, context);
}

function checkSimplification(
  expression: BooleanExpression,
  context: ValidationContext,
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
  context.accept(
    'info',
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `The expression can be simplified to ${evaluatedExpression}`,
    { node: expression },
  );
}
