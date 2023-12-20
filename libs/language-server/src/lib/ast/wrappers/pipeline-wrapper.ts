// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockDefinition,
  CompositeBlocktypeDefinition,
  PipelineDefinition,
} from '../generated/ast';

import { AstNodeWrapper } from './ast-node-wrapper';
import { PipeWrapper, createWrappersFromPipeChain } from './pipe-wrapper';

export class PipelineWrapper
  implements AstNodeWrapper<PipelineDefinition | CompositeBlocktypeDefinition>
{
  public readonly astNode: PipelineDefinition | CompositeBlocktypeDefinition;

  allPipes: PipeWrapper[] = [];

  constructor(
    pipesContainer: PipelineDefinition | CompositeBlocktypeDefinition,
  ) {
    this.astNode = pipesContainer;

    this.allPipes = pipesContainer.pipes.flatMap((pipe) =>
      createWrappersFromPipeChain(pipe),
    );
  }

  static canBeWrapped(
    pipesContainer: PipelineDefinition | CompositeBlocktypeDefinition,
  ): boolean {
    for (const pipeDefinition of pipesContainer.pipes) {
      for (
        let chainIndex = 0;
        chainIndex < pipeDefinition.blocks.length - 1;
        ++chainIndex
      ) {
        if (!PipeWrapper.canBeWrapped(pipeDefinition, chainIndex)) {
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
}
