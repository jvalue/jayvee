// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type EvaluationContext,
  PipeWrapper,
  PipelineWrapper,
  type WrapperFactory,
} from '../../ast';
import {
  BlockDefinition,
  CompositeBlocktypeDefinition,
  PipelineDefinition,
} from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

export function validatePipelineDefinition(
  pipeline: PipelineDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
): void {
  checkStartingBlocks(pipeline, validationContext, wrapperFactory);
  checkUniqueNames(pipeline.blocks, validationContext);
  checkUniqueNames(pipeline.transforms, validationContext);
  checkUniqueNames(pipeline.valuetypes, validationContext);
  checkUniqueNames(pipeline.constraints, validationContext);

  checkMultipleBlockInputs(pipeline, validationContext, wrapperFactory);
  checkDefinedBlocksAreUsed(pipeline, validationContext, wrapperFactory);
}

function checkStartingBlocks(
  pipeline: PipelineDefinition,
  context: ValidationContext,
  wrapperFactory: WrapperFactory,
): void {
  if (!wrapperFactory.Pipeline.canWrap(pipeline)) {
    return;
  }
  const pipelineWrapper = wrapperFactory.Pipeline.wrap(pipeline);

  const startingBlocks = pipelineWrapper.getStartingBlocks();
  if (startingBlocks.length === 0) {
    context.accept(
      'error',
      `An extractor block is required for this pipeline`,
      {
        node: pipeline,
        property: 'name',
      },
    );
  }
}

export function checkMultipleBlockInputs(
  pipeline: PipelineDefinition | CompositeBlocktypeDefinition,
  context: ValidationContext,
  wrapperFactory: WrapperFactory,
): void {
  if (!wrapperFactory.Pipeline.canWrap(pipeline)) {
    return;
  }
  const pipelineWrapper = wrapperFactory.Pipeline.wrap(pipeline);

  const startingBlocks = pipelineWrapper.getStartingBlocks();
  let alreadyMarkedPipes: PipeWrapper[] = [];
  for (const startingBlock of startingBlocks) {
    alreadyMarkedPipes = doCheckMultipleBlockInputs(
      pipelineWrapper,
      startingBlock,
      alreadyMarkedPipes,
      context,
    );
  }
}

/**
 * Inner method to check recursively whether blocks in a pipeline have multiple inputs
 * @param pipelineWrapper The wrapping pipeline
 * @param block The current block
 * @param alreadyMarkedPipes List of already visited pipes to avoid duplicate errors
 * @param context The validation context
 * @returns the updated @alreadyMarkedPipes with all marked pipes
 */
function doCheckMultipleBlockInputs(
  pipelineWrapper: PipelineWrapper<
    PipelineDefinition | CompositeBlocktypeDefinition
  >,
  block: BlockDefinition,
  alreadyMarkedPipes: PipeWrapper[],
  context: ValidationContext,
): PipeWrapper[] {
  const pipesFromParents = pipelineWrapper.getIngoingPipes(block);
  if (pipesFromParents.length > 1) {
    const parentBlockNames = pipesFromParents.map(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      (pipe) => '"' + pipe.from?.name + '"',
    );
    for (const pipe of pipesFromParents) {
      const wasAlreadyMarked = alreadyMarkedPipes.some((x) => pipe.equals(x));
      if (wasAlreadyMarked) {
        continue;
      }

      context.accept(
        'error',
        `At most one pipe can be connected to the input of a block. Currently, the following ${
          pipesFromParents.length
        } blocks are connected via pipes: ${parentBlockNames.join(', ')}`,
        pipe.getToDiagnostic(),
      );

      alreadyMarkedPipes.push(pipe);
    }
  }

  const children = pipelineWrapper.getChildBlocks(block);
  for (const child of children) {
    alreadyMarkedPipes = doCheckMultipleBlockInputs(
      pipelineWrapper,
      child,
      alreadyMarkedPipes,
      context,
    );
  }

  return alreadyMarkedPipes;
}

export function checkDefinedBlocksAreUsed(
  pipeline: PipelineDefinition | CompositeBlocktypeDefinition,
  context: ValidationContext,
  wrapperFactory: WrapperFactory,
): void {
  if (!wrapperFactory.Pipeline.canWrap(pipeline)) {
    return;
  }
  const pipelineWrapper = wrapperFactory.Pipeline.wrap(pipeline);

  const containedBlocks = pipeline.blocks;
  for (const block of containedBlocks) {
    doCheckDefinedBlockIsUsed(pipelineWrapper, block, context, wrapperFactory);
  }
}

function doCheckDefinedBlockIsUsed(
  pipelineWrapper: PipelineWrapper<
    PipelineDefinition | CompositeBlocktypeDefinition
  >,
  block: BlockDefinition,
  context: ValidationContext,
  wrapperFactory: WrapperFactory,
): void {
  if (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    block.type === undefined ||
    !wrapperFactory.BlockType.canWrap(block.type)
  ) {
    return;
  }
  const blockType = wrapperFactory.BlockType.wrap(block.type);

  const isExtractorBlock = !blockType.hasInput();
  if (!isExtractorBlock) {
    const parents = pipelineWrapper.getParentBlocks(block);
    if (parents.length === 0) {
      context.accept(
        'warning',
        `A pipe should be connected to the input of this block`,
        {
          node: block,
          property: 'name',
        },
      );
    }
  }

  const isLoaderBlock = !blockType.hasOutput();
  if (!isLoaderBlock) {
    const children = pipelineWrapper.getChildBlocks(block);
    if (children.length === 0) {
      context.accept(
        'warning',
        `A pipe should be connected to the output of this block`,
        {
          node: block,
          property: 'name',
        },
      );
    }
  }
}
