// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */

import { assertUnreachable } from 'langium';

import { type ValidationContext } from '..';
import {
  type ConstraintDefinition,
  type Expression,
  isFreeVariableLiteral,
  isReferenceLiteral,
  isValueKeywordLiteral,
} from '../../ast';
import { inferExpressionType } from '../../ast/expressions/type-inference';
import { type JayveeValidationProps } from '../validation-registry';
import {
  checkExpressionSimplification,
  iterateSubExpressionBreadthFirst,
} from '../validation-util';

export function validateConstraintDefinition(
  constraint: ConstraintDefinition,
  props: JayveeValidationProps,
): void {
  checkConstraintExpression(constraint.expression, undefined, props);
}

export function checkConstraintExpression(
  expression: Expression,
  valueTypePropertyName: string | undefined,
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

  const foundFittingFreeVariable = findFittingFreeVariable(
    expression,
    valueTypePropertyName,
    props.validationContext,
  );
  if (!foundFittingFreeVariable) {
    const errorMessage =
      valueTypePropertyName === undefined
        ? 'A constraint expression must contain the `value` keyword'
        : `An inline constraint expression must contain a reference to the valuetype's property`;
    props.validationContext.accept('error', errorMessage, {
      node: expression,
    });
  }
}

function findFittingFreeVariable(
  expression: Expression,
  valueTypePropertyName: string | undefined,
  validationContext: ValidationContext,
): boolean {
  return (
    iterateSubExpressionBreadthFirst(
      expression,
      // INFO: If the anonymous function returns `true` iteration stops early,
      // if it returns `undefined` the search continues. See
      // `iterateSubExpressionBreadthFirst`'s documentation for more information
      (subExpression): true | undefined => {
        if (isValueKeywordLiteral(subExpression)) {
          if (valueTypePropertyName !== undefined) {
            validationContext.accept(
              'error',
              "Inline constraint definitions must not contain the value keyword literal. Use the valuetype's property instead",
              {
                node: subExpression,
              },
            );
            return undefined;
          }
          return true;
        } else if (isReferenceLiteral(subExpression)) {
          if (valueTypePropertyName === undefined) {
            return undefined;
          }
          return valueTypePropertyName === subExpression.value.ref?.name
            ? true
            : undefined;
        } else if (isFreeVariableLiteral(subExpression)) {
          assertUnreachable(subExpression);
        }
        return undefined;
      },
    ) ?? false
  );
}
