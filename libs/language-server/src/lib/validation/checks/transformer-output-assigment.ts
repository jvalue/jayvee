// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { assertUnreachable } from 'langium';

// eslint-disable-next-line import/no-cycle
import {
  EvaluationContext,
  EvaluationStrategy,
  evaluateExpression,
} from '../../ast/expressions/evaluation';
import { convertsImplicitlyTo } from '../../ast/expressions/operator-type-computer';
import { inferExpressionType } from '../../ast/expressions/type-inference';
import {
  Expression,
  TransformerOutputAssignment,
  VariableLiteral,
  isBinaryExpression,
  isExpression,
  isExpressionLiteral,
  isUnaryExpression,
  isValueLiteral,
  isVariableLiteral,
} from '../../ast/generated/ast';
import { inferBasePropertyValuetype } from '../../ast/model-util';
import { ValidationContext } from '../validation-context';

export function validateTransformerOutputAssignment(
  outputAssignment: TransformerOutputAssignment,
  context: ValidationContext,
): void {
  checkOutputValueTyping(outputAssignment, context);
  checkOutputNotInAssignmentExpression(outputAssignment, context);
}

function checkOutputValueTyping(
  outputAssignment: TransformerOutputAssignment,
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

  if (!convertsImplicitlyTo(inferredType, expectedType)) {
    context.accept(
      'error',
      `The value needs to be of type ${expectedType} but is of type ${inferredType}`,
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
  outputAssignment: TransformerOutputAssignment,
  context: ValidationContext,
): void {
  const variables = getReferencedVariables(outputAssignment?.expression);
  const usedOutputPorts = variables.filter((x) => x.value.ref?.kind === 'to');

  usedOutputPorts.forEach((outputPort) => {
    if (outputPort.value.ref?.kind === 'to') {
      context.accept(
        'error',
        'Output ports are not allowed in this expression',
        {
          node: outputPort,
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

export function getReferencedVariables(
  expression: Expression | undefined,
): VariableLiteral[] {
  if (expression === undefined) {
    return [];
  }

  if (isExpressionLiteral(expression)) {
    if (isVariableLiteral(expression)) {
      return [expression];
    } else if (isValueLiteral(expression)) {
      return [];
    }
    assertUnreachable(expression);
  } else if (isBinaryExpression(expression)) {
    return [
      ...getReferencedVariables(expression.left),
      ...getReferencedVariables(expression.right),
    ];
  } else if (isUnaryExpression(expression)) {
    return getReferencedVariables(expression.expression);
  }
  assertUnreachable(expression);
}
