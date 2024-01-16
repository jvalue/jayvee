// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { assertUnreachable } from 'langium';

import { PipelineWrapper } from '../../ast';
import {
  BlockDefinition,
  isCompositeBlocktypeDefinition,
} from '../../ast/generated/ast';
import { PipeWrapper } from '../../ast/wrappers/pipe-wrapper';
import { BlockTypeWrapper } from '../../ast/wrappers/typed-object/blocktype-wrapper';
import { ValidationContext } from '../validation-context';

export function validateBlockDefinition(
  block: BlockDefinition,
  context: ValidationContext,
): void {
  checkPipesOfBlock(block, 'input', context);
  checkPipesOfBlock(block, 'output', context);
}

function checkPipesOfBlock(
  block: BlockDefinition,
  whatToCheck: 'input' | 'output',
  context: ValidationContext,
): void {
  if (
    !BlockTypeWrapper.canBeWrapped(block?.type) ||
    !PipelineWrapper.canBeWrapped(block.$container)
  ) {
    return;
  }
  const blockType = new BlockTypeWrapper(block?.type);
  const pipes = collectPipes(block, whatToCheck);

  const hasMultipleInputPorts = pipes.length > 1 && whatToCheck === 'input';
  if (hasMultipleInputPorts) {
    for (const pipe of pipes) {
      context.accept(
        'error',
        `At most one pipe can be connected to the ${whatToCheck} of a ${blockType.type}`,
        pipe.getToDiagnostic(),
      );
    }
    return;
  }

  if (pipes.length === 0) {
    const isLastBlockOfCompositeBlocktype =
      isCompositeBlocktypeDefinition(block.$container) &&
      block.$container.blocks.at(-1)?.name === block.name;

    const isFirstBlockOfCompositeBlocktype =
      isCompositeBlocktypeDefinition(block.$container) &&
      block.$container.blocks.at(0)?.name === block.name;

    const isExtractorBlock = !blockType.hasInput() && whatToCheck === 'input';
    const isLoaderBlock = !blockType.hasOutput() && whatToCheck === 'output';

    // exception: the first block in a composite block is connected to the input, not another block
    // exception: The last block in a composite block is connected to the output, not another block
    // exception: the extractor / loader block in a pipeline
    if (
      !isLastBlockOfCompositeBlocktype &&
      !isFirstBlockOfCompositeBlocktype &&
      !isExtractorBlock &&
      !isLoaderBlock
    ) {
      context.accept(
        'warning',
        `A pipe should be connected to the ${whatToCheck} of this block`,
        {
          node: block,
          property: 'name',
        },
      );
    }
  }
}

function collectPipes(
  block: BlockDefinition,
  whatToCheck: 'input' | 'output',
): PipeWrapper[] {
  const pipelineWrapper = new PipelineWrapper(block.$container);

  let pipes: PipeWrapper[];
  switch (whatToCheck) {
    case 'input': {
      pipes = pipelineWrapper.getIngoingPipes(block);
      break;
    }
    case 'output': {
      pipes = pipelineWrapper.getOutgoingPipes(block);
      break;
    }
    default: {
      assertUnreachable(whatToCheck);
    }
  }
  return pipes;
}
