// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type PipeWrapper, type PipelineWrapper } from '../../ast';
import {
  type BlockDefinition,
  type CompositeBlockTypeDefinition,
  type PipelineDefinition,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';
import { checkUniqueNames } from '../validation-util';

export function validatePipelineDefinition(
  pipeline: PipelineDefinition,
  props: JayveeValidationProps,
): void {
  checkStartingBlocks(pipeline, props);
  checkUniqueNames(pipeline.blocks, props.validationContext);
  checkUniqueNames(pipeline.transforms, props.validationContext);
  checkUniqueNames(pipeline.valueTypes, props.validationContext);
  checkUniqueNames(pipeline.constraints, props.validationContext);

  checkMultipleBlockInputs(pipeline, props);
  checkDefinedBlocksAreUsed(pipeline, props);
}

function checkStartingBlocks(
  pipeline: PipelineDefinition,
  props: JayveeValidationProps,
): void {
  if (!props.wrapperFactories.Pipeline.canWrap(pipeline)) {
    return;
  }
  const pipelineWrapper = props.wrapperFactories.Pipeline.wrap(pipeline);

  const startingBlocks = pipelineWrapper.getStartingBlocks();
  if (startingBlocks.length === 0) {
    props.validationContext.accept(
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
  pipeline: PipelineDefinition | CompositeBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  if (!props.wrapperFactories.Pipeline.canWrap(pipeline)) {
    return;
  }
  const pipelineWrapper = props.wrapperFactories.Pipeline.wrap(pipeline);

  const startingBlocks = pipelineWrapper.getStartingBlocks();
  let alreadyMarkedPipes: PipeWrapper[] = [];
  for (const startingBlock of startingBlocks) {
    alreadyMarkedPipes = doCheckMultipleBlockInputs(
      pipelineWrapper,
      startingBlock,
      alreadyMarkedPipes,
      props,
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
    PipelineDefinition | CompositeBlockTypeDefinition
  >,
  block: BlockDefinition,
  alreadyMarkedPipes: PipeWrapper[],
  props: JayveeValidationProps,
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

      props.validationContext.accept(
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
      props,
    );
  }

  return alreadyMarkedPipes;
}

export function checkDefinedBlocksAreUsed(
  pipeline: PipelineDefinition | CompositeBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  if (!props.wrapperFactories.Pipeline.canWrap(pipeline)) {
    return;
  }
  const pipelineWrapper = props.wrapperFactories.Pipeline.wrap(pipeline);

  const containedBlocks = pipeline.blocks;
  for (const block of containedBlocks) {
    doCheckDefinedBlockIsUsed(pipelineWrapper, block, props);
  }
}

function doCheckDefinedBlockIsUsed(
  pipelineWrapper: PipelineWrapper<
    PipelineDefinition | CompositeBlockTypeDefinition
  >,
  block: BlockDefinition,
  props: JayveeValidationProps,
): void {
  if (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    block.type === undefined ||
    !props.wrapperFactories.BlockType.canWrap(block.type)
  ) {
    return;
  }
  const blockType = props.wrapperFactories.BlockType.wrap(block.type);

  const isExtractorBlock = !blockType.hasInput();
  if (!isExtractorBlock) {
    const parents = pipelineWrapper.getParentBlocks(block);
    if (parents.length === 0) {
      props.validationContext.accept(
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
      props.validationContext.accept(
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
