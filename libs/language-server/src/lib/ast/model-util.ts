// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { AstNode, assertUnreachable } from 'langium';

// eslint-disable-next-line import/no-cycle
import { getMetaInformation } from '../meta-information/meta-inf-registry';

import {
  BinaryExpression,
  BlockDefinition,
  PipelineDefinition,
  PrimitiveValuetypeKeywordLiteral,
  UnaryExpression,
  ValuetypeDefinitionReference,
  isPrimitiveValuetypeKeywordLiteral,
  isValuetypeDefinitionReference,
} from './generated/ast';
import { PipeWrapper, createSemanticPipes } from './wrappers/pipe-wrapper';
// eslint-disable-next-line import/no-cycle
import {
  PrimitiveValuetype,
  PrimitiveValuetypes,
} from './wrappers/value-type/primitive';

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

export type UnaryExpressionOperator = UnaryExpression['operator'];
export type BinaryExpressionOperator = BinaryExpression['operator'];

export function getValuetypeName(
  valuetype: PrimitiveValuetypeKeywordLiteral | ValuetypeDefinitionReference,
): string {
  if (isValuetypeDefinitionReference(valuetype)) {
    return valuetype.reference.$refText;
  }
  return valuetype.keyword;
}

export function inferBasePropertyValuetype(
  valuetype: PrimitiveValuetypeKeywordLiteral | ValuetypeDefinitionReference,
): PrimitiveValuetype | undefined {
  let keyword: PrimitiveValuetypeKeywordLiteral | undefined;
  if (isValuetypeDefinitionReference(valuetype)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    keyword = valuetype?.reference?.ref?.type;
  } else if (isPrimitiveValuetypeKeywordLiteral(valuetype)) {
    keyword = valuetype;
  } else {
    assertUnreachable(valuetype);
  }

  if (keyword === undefined) {
    return keyword;
  }

  return inferPropertyValuetypeFromKeyword(keyword);
}

export function inferPropertyValuetypeFromKeyword(
  valuetype: PrimitiveValuetypeKeywordLiteral,
): PrimitiveValuetype {
  const keyword = valuetype.keyword;
  switch (keyword) {
    case 'boolean':
      return PrimitiveValuetypes.Boolean;
    case 'decimal':
      return PrimitiveValuetypes.Decimal;
    case 'integer':
      return PrimitiveValuetypes.Integer;
    case 'text':
      return PrimitiveValuetypes.Text;
    default:
      assertUnreachable(keyword);
  }
}

export type AstTypeGuard<T extends AstNode = AstNode> = (
  obj: unknown,
) => obj is T;
