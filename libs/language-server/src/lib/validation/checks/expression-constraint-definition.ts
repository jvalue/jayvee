// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { EvaluationContext } from '../../ast/expressions/evaluation';
import { inferExpressionType } from '../../ast/expressions/type-inference';
import { ExpressionConstraintDefinition } from '../../ast/generated/ast';
import { PrimitiveValuetypes } from '../../ast/wrappers/value-type/primitive/primitive-valuetypes';
import { ValidationContext } from '../validation-context';
import { checkExpressionSimplification } from '../validation-util';

export function validateExpressionConstraintDefinition(
  constraint: ExpressionConstraintDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  checkConstraintExpression(constraint, validationContext, evaluationContext);
}

function checkConstraintExpression(
  constraint: ExpressionConstraintDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  const expression = constraint?.expression;
  const inferredType = inferExpressionType(expression, validationContext);
  if (inferredType === undefined) {
    return;
  }

  const expectedType = PrimitiveValuetypes.Boolean;
  if (!inferredType.isConvertibleTo(expectedType)) {
    validationContext.accept(
      'error',
      `The value needs to be of type ${expectedType.getName()} but is of type ${inferredType.getName()}`,
      {
        node: expression,
      },
    );
    return;
  }

  checkExpressionSimplification(
    expression,
    validationContext,
    evaluationContext,
  );
}
