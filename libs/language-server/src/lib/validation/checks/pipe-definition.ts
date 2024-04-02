// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { type WrapperFactory } from '../../ast';
import { PipeDefinition } from '../../ast/generated/ast';
import { createWrappersFromPipeChain } from '../../ast/wrappers/pipe-wrapper';
import { ValidationContext } from '../validation-context';

export function validatePipeDefinition(
  pipe: PipeDefinition,
  context: ValidationContext,
  wrapperFactory: WrapperFactory,
): void {
  checkBlockCompatibility(pipe, context, wrapperFactory);
}

function checkBlockCompatibility(
  pipe: PipeDefinition,
  context: ValidationContext,
  wrapperFactory: WrapperFactory,
): void {
  const pipeWrappers = createWrappersFromPipeChain(pipe);
  for (const pipeWrapper of pipeWrappers) {
    const fromBlockTypeDefinition = pipeWrapper.from?.type;
    const toBlockTypeDefinition = pipeWrapper.to?.type;

    if (
      !wrapperFactory.BlockType.canWrap(fromBlockTypeDefinition) ||
      !wrapperFactory.BlockType.canWrap(toBlockTypeDefinition)
    ) {
      continue;
    }
    const fromBlockType = wrapperFactory.BlockType.wrap(
      fromBlockTypeDefinition,
    );
    const toBlockType = wrapperFactory.BlockType.wrap(toBlockTypeDefinition);

    const isFromBlockLoader = !fromBlockType.hasOutput();
    const isToBlockExtractor = !toBlockType.hasInput();

    if (isFromBlockLoader) {
      const errorMessage = `Block "${pipeWrapper.from?.name}" cannot be connected to other blocks. Its blocktype "${fromBlockType.astNode.name}" has output type "${fromBlockType.outputType}".`;
      context.accept('error', errorMessage, pipeWrapper.getFromDiagnostic());
    }

    if (isToBlockExtractor) {
      const errorMessage = `Block "${pipeWrapper.to?.name}" cannot be connected to from other blocks. Its blocktype "${toBlockType.astNode.name}" has input type "${toBlockType.inputType}".`;
      context.accept('error', errorMessage, pipeWrapper.getToDiagnostic());
    }

    if (!fromBlockType.canBeConnectedTo(toBlockType)) {
      const errorMessage = `The output type "${fromBlockType.outputType}" of block "${pipeWrapper.from?.name}" (of type "${fromBlockType.astNode.name}") is not compatible with the input type "${toBlockType.inputType}" of block "${pipeWrapper.to?.name}" (of type "${toBlockType.astNode.name}")`;
      context.accept('error', errorMessage, pipeWrapper.getFromDiagnostic());
      context.accept('error', errorMessage, pipeWrapper.getToDiagnostic());
    }
  }
}
