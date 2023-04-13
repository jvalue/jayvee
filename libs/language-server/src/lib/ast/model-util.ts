// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { AstNode, assertUnreachable } from 'langium';

// eslint-disable-next-line import/no-cycle
import { getMetaInformation } from '../meta-information/meta-inf-registry';

import {
  BlockDefinition,
  BooleanExpression,
  PipelineDefinition,
  PrimitiveValuetypeKeywordLiteral,
  PropertyValueLiteral,
  ValuetypeDefinitionReference,
  isBinaryExpression,
  isBooleanExpression,
  isBooleanLiteral,
  isCellRangeLiteral,
  isCollectionLiteral,
  isConstraintReferenceLiteral,
  isNumericLiteral,
  isRegexLiteral,
  isTextLiteral,
  isUnaryExpression,
  isValuetypeAssignmentLiteral,
  isValuetypeDefinitionReference,
} from './generated/ast';
import { PipeWrapper, createSemanticPipes } from './wrappers/pipe-wrapper';

export function collectStartingBlocks(
  pipeline: PipelineDefinition,
): BlockDefinition[] {
  const result: BlockDefinition[] = [];
  for (const block of pipeline.blocks) {
    const blockMetaInf = getMetaInformation(block.type);
    if (blockMetaInf === undefined) {
      continue;
    }

    if (!blockMetaInf.hasInput()) {
      result.push(block);
    }
  }
  return result;
}

export function collectChildren(block: BlockDefinition): BlockDefinition[] {
  const outgoingPipes = collectOutgoingPipes(block);
  return outgoingPipes.map((pipe) => pipe.to);
}

export function collectParents(block: BlockDefinition): BlockDefinition[] {
  const ingoingPipes = collectIngoingPipes(block);
  return ingoingPipes.map((pipe) => pipe.from);
}

export function collectOutgoingPipes(block: BlockDefinition) {
  return collectPipes(block, 'outgoing');
}

export function collectIngoingPipes(block: BlockDefinition) {
  return collectPipes(block, 'ingoing');
}

function collectPipes(
  block: BlockDefinition,
  kind: 'outgoing' | 'ingoing',
): PipeWrapper[] {
  const pipeline = block.$container;
  const allPipes = collectAllPipes(pipeline);

  return allPipes.filter((semanticPipe) => {
    switch (kind) {
      case 'outgoing':
        return semanticPipe.from === block;
      case 'ingoing':
        return semanticPipe.to === block;
    }
    return assertUnreachable(kind);
  });
}

export function collectAllPipes(pipeline: PipelineDefinition): PipeWrapper[] {
  const result: PipeWrapper[] = [];
  for (const pipe of pipeline.pipes) {
    result.push(...createSemanticPipes(pipe));
  }
  return result;
}

/**
 * Returns blocks in a pipeline in topological order, based on
 * Kahn's algorithm.
 *
 * Considers a pipeline as a directed, acyclical graph where
 * blocks are nodes and pipes are edges. A list in topological
 * order has the property that parent nodes are always listed
 * before their children.
 *
 * "[...] a list in topological order is such that no element
 * appears in it until after all elements appearing on all paths
 * leading to the particular element have been listed."
 *
 * Kahn, A. B. (1962). Topological sorting of large networks. Communications of the ACM, 5(11), 558–562.
 */
export function getBlocksInTopologicalSorting(
  pipeline: PipelineDefinition,
): BlockDefinition[] {
  const sortedNodes = [];
  const currentNodes = [...collectStartingBlocks(pipeline)];
  let unvisitedEdges = [...collectAllPipes(pipeline)];

  while (currentNodes.length > 0) {
    const node = currentNodes.pop();
    assert(node !== undefined);

    sortedNodes.push(node);

    for (const childNode of collectChildren(node)) {
      // Mark edges between parent and child as visited
      collectIngoingPipes(childNode)
        .filter((e) => e.from === node)
        .forEach((e) => {
          unvisitedEdges = unvisitedEdges.filter((edge) => !edge.equals(e));
        });

      // If all edges to the child have been visited
      const notRemovedEdges = collectIngoingPipes(childNode).filter((e) =>
        unvisitedEdges.some((edge) => edge.equals(e)),
      );
      if (notRemovedEdges.length === 0) {
        // Insert it into currentBlocks
        currentNodes.push(childNode);
      }
    }
  }

  // If the graph still contains unvisited edges it is not a DAG
  assert(
    unvisitedEdges.length === 0,
    `The pipeline ${pipeline.name} is expected to have no cycles`,
  );

  return sortedNodes;
}

export enum IOType {
  NONE = 'None',
  FILE = 'File',
  TEXT_FILE = 'TextFile',
  FILE_SYSTEM = 'FileSystem',
  SHEET = 'Sheet',
  TABLE = 'Table',
}

export enum PropertyValuetype {
  TEXT = 'text',
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  BOOLEAN = 'boolean',
  CELL_RANGE = 'cell-range',
  REGEX = 'regex',
  COLLECTION = 'collection',
  VALUETYPE_ASSIGNMENT = 'valuetype-assignment',
  CONSTRAINT = 'constraint',
}

export function runtimeParameterAllowedForType(
  type: PropertyValuetype,
): boolean {
  switch (type) {
    case PropertyValuetype.CELL_RANGE:
    case PropertyValuetype.REGEX:
    case PropertyValuetype.VALUETYPE_ASSIGNMENT:
    case PropertyValuetype.COLLECTION:
    case PropertyValuetype.CONSTRAINT:
      return false;
    case PropertyValuetype.TEXT:
    case PropertyValuetype.INTEGER:
    case PropertyValuetype.DECIMAL:
    case PropertyValuetype.BOOLEAN:
      return true;
    default:
      assertUnreachable(type);
  }
}

export function inferTypesFromValue(
  value: PropertyValueLiteral,
): PropertyValuetype[] {
  if (isTextLiteral(value)) {
    return [PropertyValuetype.TEXT];
  }
  if (isNumericLiteral(value)) {
    if (Number.isInteger(value.value)) {
      return [PropertyValuetype.INTEGER, PropertyValuetype.DECIMAL];
    }
    return [PropertyValuetype.DECIMAL];
  }
  if (isBooleanExpression(value)) {
    return [PropertyValuetype.BOOLEAN];
  }
  if (isCollectionLiteral(value)) {
    return [PropertyValuetype.COLLECTION];
  }
  if (isCellRangeLiteral(value)) {
    return [PropertyValuetype.CELL_RANGE];
  }
  if (isRegexLiteral(value)) {
    return [PropertyValuetype.REGEX];
  }
  if (isValuetypeAssignmentLiteral(value)) {
    return [PropertyValuetype.VALUETYPE_ASSIGNMENT];
  }
  if (isConstraintReferenceLiteral(value)) {
    return [PropertyValuetype.CONSTRAINT];
  }

  assertUnreachable(value);
}

export function evaluateExpression(expression: BooleanExpression): boolean {
  if (isBooleanLiteral(expression)) {
    return expression.value;
  }
  if (isUnaryExpression(expression)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    assert(expression.operator === '!');
    return !evaluateExpression(expression.expression);
  }
  if (isBinaryExpression(expression)) {
    const operator = expression.operator;
    switch (operator) {
      case '==': {
        const leftValue = evaluateExpression(expression.left);
        const rightValue = evaluateExpression(expression.right);
        return leftValue === rightValue;
      }
      case '!=': {
        const leftValue = evaluateExpression(expression.left);
        const rightValue = evaluateExpression(expression.right);
        return leftValue !== rightValue;
      }
      case 'xor': {
        const leftValue = evaluateExpression(expression.left);
        const rightValue = evaluateExpression(expression.right);
        return (leftValue && !rightValue) || (!leftValue && rightValue);
      }
      case 'and': {
        const leftValue = evaluateExpression(expression.left);
        if (!leftValue) {
          return false;
        }
        const rightValue = evaluateExpression(expression.right);
        return rightValue;
      }
      case 'or': {
        const leftValue = evaluateExpression(expression.left);
        if (leftValue) {
          return true;
        }
        const rightValue = evaluateExpression(expression.right);
        return rightValue;
      }
      default:
        assertUnreachable(operator);
    }
    return false;
  }
  assertUnreachable(expression);
}

export function getValuetypeName(
  valuetype: PrimitiveValuetypeKeywordLiteral | ValuetypeDefinitionReference,
): string {
  if (isValuetypeDefinitionReference(valuetype)) {
    return valuetype.reference.$refText;
  }
  return valuetype.keyword;
}

export type AstTypeGuard<T extends AstNode = AstNode> = (
  obj: unknown,
) => obj is T;
