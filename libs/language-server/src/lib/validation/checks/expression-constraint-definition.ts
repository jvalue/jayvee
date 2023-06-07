// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { inferExpressionType } from '../../ast/expressions/type-inference';
import { ExpressionConstraintDefinition } from '../../ast/generated/ast';
import { PrimitiveValuetypes } from '../../ast/wrappers/value-type/primitive/primitive-valuetypes';
import { ValidationContext } from '../validation-context';
import { checkExpressionSimplification } from '../validation-util';

export function validateExpressionConstraintDefinition(
  constraint: ExpressionConstraintDefinition,
  context: ValidationContext,
): void {
  checkConstraintExpression(constraint, context);
}

function checkConstraintExpression(
  constraint: ExpressionConstraintDefinition,
  context: ValidationContext,
): void {
  const expression = constraint?.expression;
  const inferredType = inferExpressionType(expression, context);
  if (inferredType === undefined) {
    return;
  }

  const expectedType = PrimitiveValuetypes.Boolean;
  if (!inferredType.isConvertibleTo(expectedType)) {
    context.accept(
      'error',
      `The value needs to be of type ${expectedType.getName()} but is of type ${inferredType.getName()}`,
      {
        node: expression,
      },
    );
    return;
  }

  checkExpressionSimplification(expression, context);
}
