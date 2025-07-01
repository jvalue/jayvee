// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */

import { assertUnreachable } from 'langium';

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

  const foundFittingFreeVariable =
    iterateSubExpressionBreadthFirst(expression, (exp): true | undefined => {
      if (isValueKeywordLiteral(exp)) {
        if (valueTypePropertyName !== undefined) {
          props.validationContext.accept(
            'error',
            "Inline constraint definitions must not contain the value keyword literal. Use the valuetype's property instead",
            {
              node: exp,
            },
          );
          return undefined;
        }
        return true;
      } else if (isReferenceLiteral(exp)) {
        if (valueTypePropertyName === undefined) {
          return undefined;
        }
        return valueTypePropertyName === exp.value.ref?.name ? true : undefined;
      } else if (isFreeVariableLiteral(exp)) {
        assertUnreachable(exp);
      }
      return undefined;
    }) ?? false;

  // HACK(jonas): ESLint does not realize that `expressionContainsValueLiteral` is
  // modified from inside the anonymous function, thus the
  // `no-unnecessary-condition` rule emitts a false positive
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
