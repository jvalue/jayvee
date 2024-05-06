// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type BlockDefinition,
  type CompositeBlockTypeDefinition,
  type PipelineDefinition,
} from '../generated/ast';

import { type AstNodeWrapper } from './ast-node-wrapper';
import { type PipeWrapper } from './pipe-wrapper';
import { type IPipeWrapperFactory } from './wrapper-factory-provider';

export class PipelineWrapper<
  T extends PipelineDefinition | CompositeBlockTypeDefinition,
> implements AstNodeWrapper<T>
{
  public readonly astNode: T;

  allPipes: PipeWrapper[] = [];

  constructor(pipesContainer: T, pipeWrapperFactory: IPipeWrapperFactory) {
    this.astNode = pipesContainer;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (pipesContainer.pipes === undefined) {
      this.allPipes = [];
      return;
    }

    this.allPipes = pipesContainer.pipes.flatMap((pipe) =>
      pipeWrapperFactory.wrapAll(pipe),
    );
  }

  static canBeWrapped(
    pipesContainer: PipelineDefinition | CompositeBlockTypeDefinition,
    pipeWrapperFactory: IPipeWrapperFactory,
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (pipesContainer.pipes === undefined) {
      return true;
    }

    for (const pipeDefinition of pipesContainer.pipes) {
      for (
        let chainIndex = 0;
        chainIndex < pipeDefinition.blocks.length - 1;
        ++chainIndex
      ) {
        if (!pipeWrapperFactory.canWrap(pipeDefinition, chainIndex)) {
          return false;
        }
      }
    }
    return true;
  }

  getStartingBlockPipes(): PipeWrapper[] {
    return this.allPipes.filter((pipe) => {
      const parentBlock = pipe.from;
      const isToOfOtherPipe =
        this.allPipes.filter((p) => p.to === parentBlock).length > 0;
      return !isToOfOtherPipe;
    });
  }

  getStartingBlocks(): BlockDefinition[] {
    const startingBlocks = this.getStartingBlockPipes().map((p) => p.from);

    // Special case: the extractor is reused for multiple paths
    // Thus, we remove duplicates
    const withoutDuplicates = [...new Set(startingBlocks)];
    return withoutDuplicates;
  }

  getOutgoingPipes(blockDefinition: BlockDefinition): PipeWrapper[] {
    return this.allPipes.filter((pipe) => {
      return pipe.from === blockDefinition;
    });
  }

  getChildBlocks(blockDefinition: BlockDefinition): BlockDefinition[] {
    return this.getOutgoingPipes(blockDefinition).map((p) => p.to);
  }

  getIngoingPipes(blockDefinition: BlockDefinition): PipeWrapper[] {
    return this.allPipes.filter((pipe) => {
      return pipe.to === blockDefinition;
    });
  }

  getParentBlocks(blockDefinition: BlockDefinition): BlockDefinition[] {
    return this.getIngoingPipes(blockDefinition).map((p) => p.from);
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
  getBlocksInTopologicalSorting(): BlockDefinition[] {
    const sortedNodes = [];
    const currentNodes = [...this.getStartingBlocks()];
    let unvisitedEdges = [...this.allPipes];

    while (currentNodes.length > 0) {
      const node = currentNodes.pop();
      assert(node !== undefined);

      sortedNodes.push(node);

      for (const childNode of this.getChildBlocks(node)) {
        // Mark edges between parent and child as visited
        this.getIngoingPipes(childNode)
          .filter((e) => e.from === node)
          .forEach((e) => {
            unvisitedEdges = unvisitedEdges.filter((edge) => !edge.equals(e));
          });

        // If all edges to the child have been visited
        const notRemovedEdges = this.getIngoingPipes(childNode).filter((e) =>
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
      `The pipeline ${this.astNode.name} is expected to have no cycles`,
    );

    return sortedNodes;
  }
}
