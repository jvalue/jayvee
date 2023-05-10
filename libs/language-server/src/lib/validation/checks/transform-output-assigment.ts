// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { assertUnreachable } from 'langium';

import {
  EvaluationContext,
  EvaluationStrategy,
  evaluateExpression,
} from '../../ast/expressions/evaluation';
import { inferExpressionType } from '../../ast/expressions/type-inference';
import {
  Expression,
  ReferenceLiteral,
  TransformOutputAssignment,
  isBinaryExpression,
  isExpression,
  isExpressionLiteral,
  isReferenceLiteral,
  isTransformPortDefinition,
  isUnaryExpression,
} from '../../ast/generated/ast';
import { inferBasePropertyValuetype } from '../../ast/model-util';
import { ValidationContext } from '../validation-context';

export function validateTransformOutputAssignment(
  outputAssignment: TransformOutputAssignment,
  context: ValidationContext,
): void {
  checkOutputValueTyping(outputAssignment, context);
  checkOutputNotInAssignmentExpression(outputAssignment, context);
}

function checkOutputValueTyping(
  outputAssignment: TransformOutputAssignment,
  context: ValidationContext,
): void {
  const assignmentExpression = outputAssignment?.expression;
  if (assignmentExpression === undefined) {
    return;
  }

  const outputType = outputAssignment?.outPortName?.ref?.valueType;
  if (outputType === undefined) {
    return;
  }

  const inferredType = inferExpressionType(assignmentExpression, context);
  if (inferredType === undefined) {
    return;
  }

  const expectedType = inferBasePropertyValuetype(outputType);
  if (expectedType === undefined) {
    return;
  }

  if (!inferredType.isConvertibleTo(expectedType)) {
    context.accept(
      'error',
      `The value needs to be of type ${expectedType.getName()} but is of type ${inferredType.getName()}`,
      {
        node: assignmentExpression,
      },
    );
    return;
  }

  if (isExpression(assignmentExpression)) {
    checkExpressionSimplification(assignmentExpression, context);
  }
}

function checkOutputNotInAssignmentExpression(
  outputAssignment: TransformOutputAssignment,
  context: ValidationContext,
): void {
  const referenceLiterals = getReferenceLiterals(outputAssignment?.expression);

  referenceLiterals.forEach((referenceLiteral) => {
    const referenced = referenceLiteral?.value?.ref;
    if (!isTransformPortDefinition(referenced)) {
      return;
    }
    if (referenced?.kind === 'to') {
      context.accept(
        'error',
        'Output ports are not allowed in this expression',
        {
          node: referenceLiteral,
        },
      );
    }
  });
}

function checkExpressionSimplification(
  expression: Expression,
  context: ValidationContext,
): void {
  if (isExpressionLiteral(expression)) {
    return;
  }

  const evaluatedExpression = evaluateExpression(
    expression,
    new EvaluationContext(), // TODO
    EvaluationStrategy.EXHAUSTIVE,
    context,
  );
  if (evaluatedExpression !== undefined) {
    context.accept(
      'info',
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `The expression can be simplified to ${evaluatedExpression}`,
      { node: expression },
    );
  }
}

export function getReferenceLiterals(
  expression: Expression | undefined,
): ReferenceLiteral[] {
  if (expression === undefined) {
    return [];
  }

  if (isExpressionLiteral(expression)) {
    if (isReferenceLiteral(expression)) {
      return [expression];
    }
    return [];
  } else if (isBinaryExpression(expression)) {
    return [
      ...getReferenceLiterals(expression.left),
      ...getReferenceLiterals(expression.right),
    ];
  } else if (isUnaryExpression(expression)) {
    return getReferenceLiterals(expression.expression);
  }
  assertUnreachable(expression);
}
