// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */

import { type ConstraintDefinition, type Expression } from '../../ast';
import { inferExpressionType } from '../../ast/expressions/type-inference';
import { type JayveeValidationProps } from '../validation-registry';
import { checkExpressionSimplification } from '../validation-util';

export function validateConstraintDefinition(
  constraint: ConstraintDefinition,
  props: JayveeValidationProps,
): void {
  checkConstraintExpression(constraint.expression, props);
}

export function checkConstraintExpression(
  expression: Expression,
  props: JayveeValidationProps,
): void {
  const inferredType = inferExpressionType(
    expression,
    props.validationContext,
    props.valueTypeProvider,
    props.wrapperFactories,
  );
  if (inferredType === undefined) {
    return;
  }

  const expectedType = props.valueTypeProvider.Primitives.Boolean;
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
