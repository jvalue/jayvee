import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium/lib/utils/errors';

import { getMetaInformation } from '../meta-information/meta-inf-util';

import {
  AttributeValue,
  Block,
  Pipe,
  Pipeline,
  isBooleanValue,
  isCellRangeCollection,
  isCellRangeValue,
  isDataTypeAssignmentCollection,
  isIntValue,
  isLayoutReferenceValue,
  isStringValue,
} from './generated/ast';

export function collectStartingBlocks(pipeline: Pipeline): Block[] {
  const result: Block[] = [];
  for (const block of pipeline.blocks) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (block.type === undefined) {
      continue;
    }
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

export function collectChildren(block: Block): Block[] {
  const outgoingPipes = collectOutgoingPipes(block);

  const children = outgoingPipes.reduce<Block[]>((previousResult, pipe) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const blockTo = pipe.to?.ref;
    if (blockTo === undefined) {
      return previousResult;
    }
    return [...previousResult, blockTo];
  }, []);

  return children;
}

export function collectParents(block: Block): Block[] {
  const ingoingPipes = collectIngoingPipes(block);

  const parents = ingoingPipes.reduce<Block[]>((previousResult, pipe) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const blockFrom = pipe.from?.ref;
    if (blockFrom === undefined) {
      return previousResult;
    }
    return [...previousResult, blockFrom];
  }, []);

  return parents;
}

export function collectOutgoingPipes(block: Block): Pipe[] {
  const model = block.$container;
  const outgoingPipes: Pipe[] = [];

  for (const pipe of model.pipes) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (pipe.from?.ref === block) {
      outgoingPipes.push(pipe);
    }
  }

  return outgoingPipes;
}

export function collectIngoingPipes(block: Block): Pipe[] {
  const model = block.$container;
  const ingoingPipes: Pipe[] = [];

  for (const pipe of model.pipes) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (pipe.to?.ref === block) {
      ingoingPipes.push(pipe);
    }
  }

  return ingoingPipes;
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
export function getBlocksInTopologicalSorting(pipeline: Pipeline): Block[] {
  const sortedNodes = [];
  const currentNodes = [...collectStartingBlocks(pipeline)];
  let unvisitedEdges = [...pipeline.pipes];

  while (currentNodes.length > 0) {
    const node: Block = currentNodes.pop() as Block;
    sortedNodes.push(node);

    for (const childNode of collectChildren(node)) {
      // Mark edges between parent and child as visited
      collectIngoingPipes(childNode)
        .filter((e) => e.from.ref === node)
        .forEach((e) => {
          unvisitedEdges = unvisitedEdges.filter((edge) => edge !== e);
        });

      // If all edges to the child have been visited
      const notRemovedEdges = collectIngoingPipes(childNode).filter((e) =>
        unvisitedEdges.includes(e),
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

export enum AttributeType {
  STRING = 'string',
  INT = 'integer',
  BOOLEAN = 'boolean',
  LAYOUT = 'layout',
  CELL_RANGE = 'cell range',
  CELL_RANGE_COLLECTION = 'cell range collection',
  DATA_TYPE_ASSIGNMENT_COLLECTION = 'data type assignment collection',
}

export function runtimeParameterAllowedForType(type: AttributeType): boolean {
  switch (type) {
    case AttributeType.LAYOUT:
    case AttributeType.CELL_RANGE:
    case AttributeType.CELL_RANGE_COLLECTION:
    case AttributeType.DATA_TYPE_ASSIGNMENT_COLLECTION:
      return false;
    case AttributeType.STRING:
    case AttributeType.INT:
    case AttributeType.BOOLEAN:
      return true;
    default:
      assertUnreachable(type);
  }
}

export function convertAttributeValueToType(
  value: AttributeValue,
): AttributeType {
  if (isStringValue(value)) {
    return AttributeType.STRING;
  }
  if (isIntValue(value)) {
    return AttributeType.INT;
  }
  if (isBooleanValue(value)) {
    return AttributeType.BOOLEAN;
  }
  if (isCellRangeValue(value)) {
    return AttributeType.CELL_RANGE;
  }
  if (isCellRangeCollection(value)) {
    return AttributeType.CELL_RANGE_COLLECTION;
  }
  if (isDataTypeAssignmentCollection(value)) {
    return AttributeType.DATA_TYPE_ASSIGNMENT_COLLECTION;
  }
  if (isLayoutReferenceValue(value)) {
    return AttributeType.LAYOUT;
  }
  assertUnreachable(value);
}
