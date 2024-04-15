// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type PipelineWrapper } from '../../ast';
import {
  type BlockDefinition,
  type CompositeBlockTypeDefinition,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

import { validateBlockTypeDefinition } from './block-type-definition';
import { checkMultipleBlockInputs } from './pipeline-definition';

export function validateCompositeBlockTypeDefinition(
  blockType: CompositeBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  validateBlockTypeDefinition(blockType, props);
  checkHasPipeline(blockType, props);
  checkExactlyOnePipeline(blockType, props);

  checkMultipleBlockInputs(blockType, props);
  checkDefinedBlocksAreUsed(blockType, props);
}

function checkHasPipeline(
  blockType: CompositeBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blockType.pipes === undefined) {
    return;
  }

  if (blockType.pipes.length === 0) {
    props.validationContext.accept(
      'error',
      `Composite block types must define one pipeline '${blockType.name}'`,
      {
        node: blockType,
        property: 'name',
      },
    );
  }
}

function checkExactlyOnePipeline(
  blockType: CompositeBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blockType.pipes === undefined) {
    return;
  }

  if (blockType.pipes.length > 1) {
    blockType.pipes.forEach((pipe) => {
      props.validationContext.accept(
        'error',
        `Found more than one pipeline definition in composite block type '${blockType.name}'`,
        {
          node: pipe,
        },
      );
    });
  }
}

export function checkDefinedBlocksAreUsed(
  blockTypeDefinition: CompositeBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  if (!props.wrapperFactories.Pipeline.canWrap(blockTypeDefinition)) {
    return;
  }
  const pipelineWrapper =
    props.wrapperFactories.Pipeline.wrap(blockTypeDefinition);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blockTypeDefinition.blocks === undefined) {
    return;
  }

  const containedBlocks = blockTypeDefinition.blocks;
  for (const block of containedBlocks) {
    doCheckDefinedBlockIsUsed(pipelineWrapper, block, props);
  }
}

function doCheckDefinedBlockIsUsed(
  pipelineWrapper: PipelineWrapper<CompositeBlockTypeDefinition>,
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
  const pipes = pipelineWrapper.astNode.pipes;

  const isConnectedToInput = pipes.some(
    (pipe) =>
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      pipe?.blocks?.at(0)?.ref === block,
  );
  if (!isConnectedToInput) {
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

  const isConnectedToOutput = pipes.some(
    (pipeline) =>
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      pipeline?.blocks?.at(-1)?.ref === block,
  );
  if (!isConnectedToOutput) {
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
