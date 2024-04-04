// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PipelineWrapper } from '../../ast';
import {
  BlockDefinition,
  CompositeBlocktypeDefinition,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

import { validateBlocktypeDefinition } from './blocktype-definition';
import { checkMultipleBlockInputs } from './pipeline-definition';

export function validateCompositeBlockTypeDefinition(
  blockType: CompositeBlocktypeDefinition,
  props: JayveeValidationProps,
): void {
  validateBlocktypeDefinition(blockType, props);
  checkHasPipeline(blockType, props);
  checkExactlyOnePipeline(blockType, props);

  checkMultipleBlockInputs(blockType, props);
  checkDefinedBlocksAreUsed(blockType, props);
}

function checkHasPipeline(
  blockType: CompositeBlocktypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blockType.pipes === undefined) {
    return;
  }

  if (blockType.pipes.length === 0) {
    props.validationContext.accept(
      'error',
      `Composite blocktypes must define one pipeline '${blockType.name}'`,
      {
        node: blockType,
        property: 'name',
      },
    );
  }
}

function checkExactlyOnePipeline(
  blockType: CompositeBlocktypeDefinition,
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
        `Found more than one pipeline definition in composite blocktype '${blockType.name}'`,
        {
          node: pipe,
        },
      );
    });
  }
}

export function checkDefinedBlocksAreUsed(
  blocktypeDefinition: CompositeBlocktypeDefinition,
  props: JayveeValidationProps,
): void {
  if (!props.wrapperFactory.Pipeline.canWrap(blocktypeDefinition)) {
    return;
  }
  const pipelineWrapper =
    props.wrapperFactory.Pipeline.wrap(blocktypeDefinition);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktypeDefinition.blocks === undefined) {
    return;
  }

  const containedBlocks = blocktypeDefinition.blocks;
  for (const block of containedBlocks) {
    doCheckDefinedBlockIsUsed(pipelineWrapper, block, props);
  }
}

function doCheckDefinedBlockIsUsed(
  pipelineWrapper: PipelineWrapper<CompositeBlocktypeDefinition>,
  block: BlockDefinition,
  props: JayveeValidationProps,
): void {
  if (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    block.type === undefined ||
    !props.wrapperFactory.BlockType.canWrap(block.type)
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
