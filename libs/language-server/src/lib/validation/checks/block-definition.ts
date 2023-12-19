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
  if (!BlockTypeWrapper.canBeWrapped(block?.type)) {
    return;
  }
  const blockType = new BlockTypeWrapper(block?.type);
  const pipes = collectPipes(block, whatToCheck);

  const isStartOrEnd =
    (whatToCheck === 'input' && !blockType.hasInput()) ||
    (whatToCheck === 'output' && !blockType.hasOutput());
  if (isStartOrEnd) {
    if (pipes.length > 0) {
      for (const pipe of pipes) {
        context.accept(
          'error',
          `Blocks of type ${blockType.type} do not have an ${whatToCheck}`,
          whatToCheck === 'input'
            ? pipe.getToDiagnostic()
            : pipe.getFromDiagnostic(),
        );
      }
    }
    return;
  }

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

  // above: there should be pipes (defined by blocktype)
  // but there aren't any
  if (pipes.length === 0) {
    const isLastBlockOfCompositeBlocktype =
      isCompositeBlocktypeDefinition(block.$container) &&
      block.$container.blocks.at(-1)?.name === block.name;

    const isFirstBlockOfCompositeBlocktype =
      isCompositeBlocktypeDefinition(block.$container) &&
      block.$container.blocks.at(0)?.name === block.name;

    // exception: the first block in a composite block is connected to the input, not another block
    // exception: The last block in a composite block is connected to the output, not another block
    if (!isLastBlockOfCompositeBlocktype && !isFirstBlockOfCompositeBlocktype) {
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
      pipes = pipelineWrapper.getPredecessorPipes(block);
      break;
    }
    case 'output': {
      pipes = pipelineWrapper.getSuccessorPipes(block);
      break;
    }
    default: {
      assertUnreachable(whatToCheck);
    }
  }
  return pipes;
}
