// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { inferExpressionType } from '../../ast/expressions/type-inference';
import { ExpressionConstraintDefinition } from '../../ast/generated/ast';
import { PrimitiveValuetypes } from '../../ast/wrappers/value-type/primitive/primitive-value-types';
import { type JayveeValidationProps } from '../validation-registry';
import { checkExpressionSimplification } from '../validation-util';

export function validateExpressionConstraintDefinition(
  constraint: ExpressionConstraintDefinition,
  props: JayveeValidationProps,
): void {
  checkConstraintExpression(constraint, props);
}

function checkConstraintExpression(
  constraint: ExpressionConstraintDefinition,
  props: JayveeValidationProps,
): void {
  const expression = constraint?.expression;
  const inferredType = inferExpressionType(expression, props.validationContext);
  if (inferredType === undefined) {
    return;
  }

  const expectedType = PrimitiveValuetypes.Boolean;
  if (!inferredType.isConvertibleTo(expectedType)) {
    props.validationContext.accept(
      'error',
      `The value needs to be of type ${expectedType.getName()} but is of type ${inferredType.getName()}`,
      {
        node: expression,
      },
    );
    return;
  }

  checkExpressionSimplification(expression, props);
}
