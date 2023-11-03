// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  AstNode,
  LangiumDocuments,
  Reference,
  assertUnreachable,
} from 'langium';

import {
  BinaryExpression,
  BlockDefinition,
  BuiltinBlocktypeDefinition,
  BuiltinConstrainttypeDefinition,
  CompositeBlocktypeDefinition,
  PipelineDefinition,
  UnaryExpression,
  isBuiltinBlocktypeDefinition,
  isCompositeBlocktypeDefinition,
  isJayveeModel,
} from './generated/ast';
// eslint-disable-next-line import/no-cycle
import { BlockMetaInformation, ConstraintMetaInformation } from './wrappers';
import { PipeWrapper, createSemanticPipes } from './wrappers/pipe-wrapper';

export function collectStartingBlocks(
  container: PipelineDefinition | CompositeBlocktypeDefinition,
): BlockDefinition[] {
  // For composite blocks the first blocks of all pipelines are starting blocks as they have inputs
  if (isCompositeBlocktypeDefinition(container)) {
    const startingBlocks = container.pipes
      .map((pipe) => pipe.blocks[0])
      .map((blockRef: Reference<BlockDefinition> | undefined) => {
        if (
          blockRef?.ref !== undefined &&
          BlockMetaInformation.canBeWrapped(blockRef.ref.type)
        ) {
          return blockRef.ref;
        }
        return undefined;
      })
      .filter((x): x is BlockDefinition => x !== undefined);

    return startingBlocks;
  }

  const result: BlockDefinition[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const blocks = container?.blocks ?? [];
  for (const block of blocks) {
    if (!BlockMetaInformation.canBeWrapped(block.type)) {
      continue;
    }
    const blockMetaInf = new BlockMetaInformation(block.type);

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
      case undefined:
        return false;
    }
    return assertUnreachable(kind);
  });
}

export function collectAllPipes(
  container: PipelineDefinition | CompositeBlocktypeDefinition,
): PipeWrapper[] {
  const result: PipeWrapper[] = [];
  for (const pipe of container.pipes) {
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
  pipeline: PipelineDefinition | CompositeBlocktypeDefinition,
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

export type UnaryExpressionOperator = UnaryExpression['operator'];
export type BinaryExpressionOperator = BinaryExpression['operator'];

export type AstTypeGuard<T extends AstNode = AstNode> = (
  obj: unknown,
) => obj is T;

/**
 * Recursively goes upwards through the AST until it finds an AST node that satisfies the given type guard.
 * The entered AST node itself cannot be the result.
 * @param node The current AST node to start the search from.
 * @param guard The type guard function to check if a container matches the desired type.
 * @returns The desired container node that satisfies the type guard, or undefined if not found.
 */
export function getNextAstNodeContainer<T extends AstNode>(
  node: AstNode,
  guard: AstTypeGuard<T>,
): T | undefined {
  if (node.$container === undefined) {
    return undefined;
  }
  if (guard(node.$container)) {
    return node.$container;
  }
  return getNextAstNodeContainer(node.$container, guard);
}

/**
 * Utility function that gets all builtin blocktypes.
 * Duplicates are only added once.
 * Make sure to call @see initializeWorkspace first so that the file system is initialized.
 */
export function getAllBuiltinBlocktypes(
  documentService: LangiumDocuments,
): BlockMetaInformation[] {
  const allBuiltinBlocktypes: BlockMetaInformation[] = [];
  const visitedBuiltinBlocktypeDefinitions =
    new Set<BuiltinBlocktypeDefinition>();

  documentService.all
    .map((document) => document.parseResult.value)
    .forEach((parsedDocument) => {
      if (!isJayveeModel(parsedDocument)) {
        throw new Error('Expected parsed document to be a JayveeModel');
      }
      parsedDocument.blocktypes.forEach((blocktypeDefinition) => {
        if (!isBuiltinBlocktypeDefinition(blocktypeDefinition)) {
          return;
        }

        const wasAlreadyVisited =
          visitedBuiltinBlocktypeDefinitions.has(blocktypeDefinition);
        if (wasAlreadyVisited) {
          return;
        }

        if (BlockMetaInformation.canBeWrapped(blocktypeDefinition)) {
          allBuiltinBlocktypes.push(
            new BlockMetaInformation(blocktypeDefinition),
          );
          visitedBuiltinBlocktypeDefinitions.add(blocktypeDefinition);
        }
      });
    });
  return allBuiltinBlocktypes;
}

/**
 * Utility function that gets all builtin constraint types.
 * Duplicates are only added once.
 * Make sure to call @see initializeWorkspace first so that the file system is initialized.
 */
export function getAllBuiltinConstraintTypes(
  documentService: LangiumDocuments,
): ConstraintMetaInformation[] {
  const allBuiltinConstraintTypes: ConstraintMetaInformation[] = [];
  const visitedBuiltinConstraintTypeDefinitions =
    new Set<BuiltinConstrainttypeDefinition>();

  documentService.all
    .map((document) => document.parseResult.value)
    .forEach((parsedDocument) => {
      if (!isJayveeModel(parsedDocument)) {
        throw new Error('Expected parsed document to be a JayveeModel');
      }
      parsedDocument.constrainttypes.forEach((constraintTypeDefinition) => {
        const wasAlreadyVisited = visitedBuiltinConstraintTypeDefinitions.has(
          constraintTypeDefinition,
        );
        if (wasAlreadyVisited) {
          return;
        }

        if (ConstraintMetaInformation.canBeWrapped(constraintTypeDefinition)) {
          allBuiltinConstraintTypes.push(
            new ConstraintMetaInformation(constraintTypeDefinition),
          );
          visitedBuiltinConstraintTypeDefinitions.add(constraintTypeDefinition);
        }
      });
    });
  return allBuiltinConstraintTypes;
}
