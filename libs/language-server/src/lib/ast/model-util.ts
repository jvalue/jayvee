import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium/lib/utils/errors';

import { getMetaInformation } from '../meta-information/meta-inf-util';

import {
  AttributeValue,
  Block,
  Pipeline,
  PrimitiveValuetype,
  ValuetypeReference,
  isBooleanValue,
  isCellRangeValue,
  isCollection,
  isConstraintValue,
  isDecimalValue,
  isIntegerValue,
  isTextValue,
  isValuetypeAssignmentValue,
  isValuetypeReference,
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
  NONE = 'None',
  FILE = 'File',
  FILE_SYSTEM = 'FileSystem',
  SHEET = 'Sheet',
  TABLE = 'Table',
}

export enum AttributeValueType {
  TEXT = 'text',
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  BOOLEAN = 'boolean',
  CELL_RANGE = 'cell-range',
  COLLECTION = 'collection',
  VALUETYPE_ASSIGNMENT = 'valuetype-assignment',
  CONSTRAINT = 'constraint',
}

export function runtimeParameterAllowedForType(
  type: AttributeValueType,
): boolean {
  switch (type) {
    case AttributeValueType.CELL_RANGE:
    case AttributeValueType.VALUETYPE_ASSIGNMENT:
    case AttributeValueType.COLLECTION:
    case AttributeValueType.CONSTRAINT:
      return false;
    case AttributeValueType.TEXT:
    case AttributeValueType.INTEGER:
    case AttributeValueType.DECIMAL:
    case AttributeValueType.BOOLEAN:
      return true;
    default:
      assertUnreachable(type);
  }
}

export function convertAttributeValueToType(
  value: AttributeValue,
): AttributeValueType {
  if (isTextValue(value)) {
    return AttributeValueType.TEXT;
  }
  if (isIntegerValue(value)) {
    return AttributeValueType.INTEGER;
  }
  if (isDecimalValue(value)) {
    return AttributeValueType.DECIMAL;
  }
  if (isBooleanValue(value)) {
    return AttributeValueType.BOOLEAN;
  }
  if (isCellRangeValue(value)) {
    return AttributeValueType.CELL_RANGE;
  }
  if (isValuetypeAssignmentValue(value)) {
    return AttributeValueType.VALUETYPE_ASSIGNMENT;
  }
  if (isCollection(value)) {
    return AttributeValueType.COLLECTION;
  }
  if (isConstraintValue(value)) {
    return AttributeValueType.CONSTRAINT;
  }
  assertUnreachable(value);
}

export function getValuetypeName(
  valuetype: PrimitiveValuetype | ValuetypeReference,
): string {
  if (isValuetypeReference(valuetype)) {
    return valuetype.reference.$refText;
  }
  return valuetype;
}
