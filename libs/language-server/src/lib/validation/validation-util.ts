// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, assertUnreachable } from 'langium';

import {
  EvaluationContext,
  EvaluationStrategy,
  Expression,
  evaluateExpression,
  isBinaryExpression,
  isExpressionLiteral,
  isFreeVariableLiteral,
  isUnaryExpression,
  isValueLiteral,
} from '../ast';

import { ValidationContext } from './validation-context';

export type NamedAstNode = AstNode & { name: string };

export function checkUniqueNames(
  nodes: NamedAstNode[],
  context: ValidationContext,
  nodeName?: string,
): void {
  getNodesWithNonUniqueNames(nodes).forEach((node) => {
    context.accept(
      'error',
      `The ${nodeName ?? node.$type.toLowerCase()} name "${
        node.name
      }" needs to be unique.`,
      {
        node,
        property: 'name',
      },
    );
  });
}

export function getNodesWithNonUniqueNames<N extends NamedAstNode>(
  nodes: N[],
): N[] {
  const nodesByName = getNodesByName(nodes);

  const resultingNodes: N[] = [];
  for (const nodesWithSameName of Object.values(nodesByName)) {
    if (nodesWithSameName.length > 1) {
      resultingNodes.push(...nodesWithSameName);
    }
  }
  return resultingNodes;
}

function getNodesByName<N extends NamedAstNode>(
  nodes: N[],
): Record<string, N[]> {
  return groupBy<N, string>(nodes, (node) => node.name);
}

function groupBy<T, K extends keyof never>(
  elements: T[],
  keyFn: (element: T) => K | undefined,
): Record<K, T[]> {
  const initialValue = {} as Record<K, T[]>;

  return elements.reduce<Record<K, T[]>>((result, element) => {
    const key = keyFn(element);
    if (key === undefined) {
      return result;
    }
    const array: T[] | undefined = result[key];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (array === undefined) {
      result[key] = [];
    }

    result[key].push(element);
    return result;
  }, initialValue);
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
    if (evaluatedExpression !== undefined) {
      validationContext.accept(
        'info',
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `The expression can be simplified to ${evaluatedExpression}`,
        { node: expression },
      );
    }
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
    if (
      innerSubExpressions.length === 1 &&
      innerSubExpressions[0] === innerExpression
    ) {
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

    if (
      leftSubExpressions.length === 1 &&
      leftSubExpressions[0] === leftExpression &&
      rightSubExpressions.length === 1 &&
      rightSubExpressions[0] === rightExpression
    ) {
      return [expression];
    }
    return [...leftSubExpressions, ...rightSubExpressions];
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
