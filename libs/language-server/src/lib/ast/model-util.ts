import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium/lib/utils/errors';

import { getMetaInformation } from '../meta-information/meta-inf-util';

import {
  AttributeValue,
  Block,
  Pipeline,
  isBooleanValue,
  isCellRangeValue,
  isCollection,
  isDataTypeAssignmentValue,
  isIntValue,
  isStringValue,
} from './generated/ast';
import { PipeWrapper, createSemanticPipes } from './wrappers/pipe-wrapper';

export function collectStartingBlocks(pipeline: Pipeline): Block[] {
  const result: Block[] = [];
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

export function collectChildren(block: Block): Block[] {
  const outgoingPipes = collectOutgoingPipes(block);
  return outgoingPipes.map((pipe) => pipe.to);
}

export function collectParents(block: Block): Block[] {
  const ingoingPipes = collectIngoingPipes(block);
  return ingoingPipes.map((pipe) => pipe.from);
}

export function collectOutgoingPipes(block: Block) {
  return collectPipes(block, 'outgoing');
}

export function collectIngoingPipes(block: Block) {
  return collectPipes(block, 'ingoing');
}

function collectPipes(
  block: Block,
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

export function collectAllPipes(pipeline: Pipeline): PipeWrapper[] {
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
export function getBlocksInTopologicalSorting(pipeline: Pipeline): Block[] {
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
  UNDEFINED = 'Undefined',
  NONE = 'None',
  FILE = 'File',
  FILE_SYSTEM = 'FileSystem',
  SHEET = 'Sheet',
  TABLE = 'Table',
}

export enum AttributeType {
  STRING = 'string',
  INT = 'integer',
  BOOLEAN = 'boolean',
  LAYOUT = 'layout',
  CELL_RANGE = 'cell range',
  COLLECTION = 'collection',
  DATA_TYPE_ASSIGNMENT = 'data type assignment',
}

export function runtimeParameterAllowedForType(type: AttributeType): boolean {
  switch (type) {
    case AttributeType.LAYOUT:
    case AttributeType.CELL_RANGE:
    case AttributeType.DATA_TYPE_ASSIGNMENT:
    case AttributeType.COLLECTION:
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
  if (isDataTypeAssignmentValue(value)) {
    return AttributeType.DATA_TYPE_ASSIGNMENT;
  }
  if (isCollection(value)) {
    return AttributeType.COLLECTION;
  }
  assertUnreachable(value);
}
