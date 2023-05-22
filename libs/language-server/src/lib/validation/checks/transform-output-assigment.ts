// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { assertUnreachable } from 'langium';

import { inferExpressionType } from '../../ast/expressions/type-inference';
import {
  Expression,
  ReferenceLiteral,
  TransformOutputAssignment,
  isBinaryExpression,
  isExpressionLiteral,
  isReferenceLiteral,
  isTransformPortDefinition,
  isUnaryExpression,
} from '../../ast/generated/ast';
import { createValuetype } from '../../ast/wrappers/value-type/valuetype-factory';
import { ValidationContext } from '../validation-context';
import { checkExpressionSimplification } from '../validation-util';

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

  const expectedType = createValuetype(outputType);
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

  checkExpressionSimplification(assignmentExpression, context);
}

function checkOutputNotInAssignmentExpression(
  outputAssignment: TransformOutputAssignment,
  context: ValidationContext,
): void {
  const referenceLiterals = extractReferenceLiterals(
    outputAssignment?.expression,
  );

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

export function extractReferenceLiterals(
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
      ...extractReferenceLiterals(expression.left),
      ...extractReferenceLiterals(expression.right),
    ];
  } else if (isUnaryExpression(expression)) {
    return extractReferenceLiterals(expression.expression);
  }
  assertUnreachable(expression);
}
