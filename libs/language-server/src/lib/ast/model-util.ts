import { getMetaInformation } from '../meta-information/meta-inf-util';

import { Block, Pipe, Pipeline } from './generated/ast';

export function collectStartingBlocks(pipeline: Pipeline): Block[] {
  const result: Block[] = [];
  for (const block of pipeline.blocks) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (block.type !== undefined) {
      const blockMetaInf = getMetaInformation(block.type);
      if (blockMetaInf === undefined) {
        continue;
      }
      if (!blockMetaInf.hasInput()) {
        result.push(block);
      }
    }
  }
  return result;
}

export function collectChildren(block: Block): Block[] {
  const outgoingPipes = collectOutgoingPipes(block);

  const children = outgoingPipes
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    .filter((pipe) => pipe.to?.ref !== undefined)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map((pipe) => pipe.to.ref!);

  return children;
}

export function collectParents(block: Block): Block[] {
  const ingoingPipes = collectIngoingPipes(block);

  const parents = ingoingPipes
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    .filter((pipe) => pipe.from?.ref !== undefined)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map((pipe) => pipe.from.ref!);

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
  if (unvisitedEdges.length > 0) {
    throw new Error(`Pipeline ${pipeline.name} has at least one cycle`);
  }

  return sortedNodes;
}
