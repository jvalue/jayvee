// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PipelineWrapper, type WrapperFactory } from '../../ast';
import { EvaluationContext } from '../../ast/expressions/evaluation-context';
import {
  BlockDefinition,
  CompositeBlocktypeDefinition,
} from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';

import { validateBlocktypeDefinition } from './blocktype-definition';
import { checkMultipleBlockInputs } from './pipeline-definition';

export function validateCompositeBlockTypeDefinition(
  blockType: CompositeBlocktypeDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
): void {
  validateBlocktypeDefinition(blockType, validationContext, evaluationContext);
  checkHasPipeline(blockType, validationContext);
  checkExactlyOnePipeline(blockType, validationContext);

  checkMultipleBlockInputs(blockType, validationContext);
  checkDefinedBlocksAreUsed(blockType, validationContext, wrapperFactory);
}

function checkHasPipeline(
  blockType: CompositeBlocktypeDefinition,
  context: ValidationContext,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blockType.pipes === undefined) {
    return;
  }

  if (blockType.pipes.length === 0) {
    context.accept(
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
  context: ValidationContext,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blockType.pipes === undefined) {
    return;
  }

  if (blockType.pipes.length > 1) {
    blockType.pipes.forEach((pipe) => {
      context.accept(
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
  context: ValidationContext,
  wrapperFactory: WrapperFactory,
): void {
  if (!PipelineWrapper.canBeWrapped(blocktypeDefinition)) {
    return;
  }
  const pipelineWrapper = new PipelineWrapper(blocktypeDefinition);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktypeDefinition.blocks === undefined) {
    return;
  }

  const containedBlocks = blocktypeDefinition.blocks;
  for (const block of containedBlocks) {
    doCheckDefinedBlockIsUsed(pipelineWrapper, block, context, wrapperFactory);
  }
}

function doCheckDefinedBlockIsUsed(
  pipelineWrapper: PipelineWrapper<CompositeBlocktypeDefinition>,
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
  const pipes = pipelineWrapper.astNode.pipes;

  const isConnectedToInput = pipes.some(
    (pipe) =>
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      pipe?.blocks?.at(0)?.ref === block,
  );
  if (!isConnectedToInput) {
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

  const isConnectedToOutput = pipes.some(
    (pipeline) =>
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      pipeline?.blocks?.at(-1)?.ref === block,
  );
  if (!isConnectedToOutput) {
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
