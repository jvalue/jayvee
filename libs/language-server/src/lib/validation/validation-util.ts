// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { AstNode, MultiMap, assertUnreachable } from 'langium';

import {
  EvaluationContext,
  EvaluationStrategy,
  Expression,
  evaluateExpression,
  internalValueToString,
  isBinaryExpression,
  isExpressionLiteral,
  isFreeVariableLiteral,
  isTernaryExpression,
  isUnaryExpression,
  isValueLiteral,
} from '../ast';

import { ValidationContext } from './validation-context';

export type NamedAstNode = AstNode & { name: string };

export function checkUniqueNames(
  nodes: NamedAstNode[],
  context: ValidationContext,
  nodeKind?: string,
): void {
  const nodesByName = groupNodesByName(nodes);

  for (const [nodeName, nodes] of nodesByName.entriesGroupedByKey()) {
    if (nodes.length > 1) {
      for (const node of nodes) {
        context.accept(
          'error',
          `The ${
            nodeKind ?? node.$type.toLowerCase()
          } name "${nodeName}" needs to be unique.`,
          {
            node,
            property: 'name',
          },
        );
      }
    }
  }
}

function groupNodesByName(
  nodes: NamedAstNode[],
): MultiMap<string, NamedAstNode> {
  const nodesByName = new MultiMap<string, NamedAstNode>();

  for (const node of nodes) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (node?.name !== undefined) {
      nodesByName.add(node.name, node);
    }
  }

  return nodesByName;
}

export function checkExpressionSimplification(
  expression: Expression,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  const simplifiableSubExpressions = collectSubExpressionsWithoutFreeVariables(
    expression,
  ).filter(isSimplifiableExpression);

  simplifiableSubExpressions.forEach((expression) => {
    const evaluatedExpression = evaluateExpression(
      expression,
      evaluationContext,
      validationContext,
      EvaluationStrategy.EXHAUSTIVE,
    );
    assert(evaluatedExpression !== undefined);

    validationContext.accept(
      'info',
      `The expression can be simplified to ${internalValueToString(
        evaluatedExpression,
      )}`,
      { node: expression },
    );
  });
}

function collectSubExpressionsWithoutFreeVariables(
  expression: Expression | undefined,
): Expression[] {
  if (expression === undefined) {
    return [];
  }

  if (isExpressionLiteral(expression)) {
    if (isFreeVariableLiteral(expression)) {
      return [];
    }
    return [expression];
  } else if (isUnaryExpression(expression)) {
    const innerExpression = expression.expression;
    const innerSubExpressions =
      collectSubExpressionsWithoutFreeVariables(innerExpression);

    const innerExpressionHasNoFreeVariables =
      innerSubExpressions.length === 1 &&
      innerSubExpressions[0] === innerExpression;

    if (innerExpressionHasNoFreeVariables) {
      return [expression];
    }
    return innerSubExpressions;
  } else if (isBinaryExpression(expression)) {
    const leftExpression = expression.left;
    const rightExpression = expression.right;
    const leftSubExpressions =
      collectSubExpressionsWithoutFreeVariables(leftExpression);
    const rightSubExpressions =
      collectSubExpressionsWithoutFreeVariables(rightExpression);

    const leftExpressionHasNoFreeVariables =
      leftSubExpressions.length === 1 &&
      leftSubExpressions[0] === leftExpression;
    const rightExpressionHasNoFreeVariables =
      rightSubExpressions.length === 1 &&
      rightSubExpressions[0] === rightExpression;

    if (leftExpressionHasNoFreeVariables && rightExpressionHasNoFreeVariables) {
      return [expression];
    }
    return [...leftSubExpressions, ...rightSubExpressions];
  } else if (isTernaryExpression(expression)) {
    const firstExpression = expression.first;
    const secondExpression = expression.second;
    const thirdExpression = expression.third;
    const firstSubExpressions =
      collectSubExpressionsWithoutFreeVariables(firstExpression);
    const secondSubExpressions =
      collectSubExpressionsWithoutFreeVariables(secondExpression);
    const thirdSubExpressions =
      collectSubExpressionsWithoutFreeVariables(thirdExpression);

    const firstExpressionHasNoFreeVariables =
      firstSubExpressions.length === 1 &&
      firstSubExpressions[0] === firstExpression;
    const secondExpressionHasNoFreeVariables =
      secondSubExpressions.length === 1 &&
      secondSubExpressions[0] === secondExpression;
    const thirdExpressionHasNoFreeVariables =
      thirdSubExpressions.length === 1 &&
      thirdSubExpressions[0] === thirdExpression;

    if (
      firstExpressionHasNoFreeVariables &&
      secondExpressionHasNoFreeVariables &&
      thirdExpressionHasNoFreeVariables
    ) {
      return [expression];
    }
    return [
      ...firstSubExpressions,
      ...secondSubExpressions,
      ...thirdSubExpressions,
    ];
  }
  assertUnreachable(expression);
}

function isSimplifiableExpression(expression: Expression): boolean {
  return (
    !isExpressionLiteral(expression) && !isNegativeNumberExpression(expression)
  );
}

function isNegativeNumberExpression(expression: Expression): boolean {
  return (
    isUnaryExpression(expression) &&
    expression.operator === '-' &&
    isValueLiteral(expression.expression)
  );
}
