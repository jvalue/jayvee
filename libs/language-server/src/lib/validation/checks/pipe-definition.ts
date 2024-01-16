// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { PipeDefinition } from '../../ast/generated/ast';
import { createWrappersFromPipeChain } from '../../ast/wrappers/pipe-wrapper';
import { BlockTypeWrapper } from '../../ast/wrappers/typed-object/blocktype-wrapper';
import { ValidationContext } from '../validation-context';

export function validatePipeDefinition(
  pipe: PipeDefinition,
  context: ValidationContext,
): void {
  checkBlockCompatibility(pipe, context);
}

function checkBlockCompatibility(
  pipe: PipeDefinition,
  context: ValidationContext,
): void {
  const pipeWrappers = createWrappersFromPipeChain(pipe);
  for (const pipeWrapper of pipeWrappers) {
    const fromBlockTypeDefinition = pipeWrapper.from?.type;
    const toBlockTypeDefinition = pipeWrapper.to?.type;

    if (
      !BlockTypeWrapper.canBeWrapped(fromBlockTypeDefinition) ||
      !BlockTypeWrapper.canBeWrapped(toBlockTypeDefinition)
    ) {
      continue;
    }
    const fromBlockType = new BlockTypeWrapper(fromBlockTypeDefinition);
    const toBlockType = new BlockTypeWrapper(toBlockTypeDefinition);

    const isFromBlockLoader = !fromBlockType.hasOutput();
    const isToBlockExtractor = !toBlockType.hasInput();

    if (isFromBlockLoader) {
      const errorMessage = `Block "${pipeWrapper.from?.name}" cannot be connected to other blocks. Its blocktype "${fromBlockType.astNode.name}" has output type "${fromBlockType.outputType}".`;
      context.accept('error', errorMessage, pipeWrapper.getFromDiagnostic());
    }

    if (isToBlockExtractor) {
      const errorMessage = `Block "${pipeWrapper.to?.name}" cannot be connected from other blocks. Its blocktype "${toBlockType.astNode.name}" has output type "${toBlockType.outputType}".`;
      context.accept('error', errorMessage, pipeWrapper.getToDiagnostic());
    }

    if (!fromBlockType.canBeConnectedTo(toBlockType)) {
      const errorMessage = `The output type "${fromBlockType.outputType}" of ${fromBlockType.type} is incompatible with the input type "${toBlockType.inputType}" of ${toBlockType.type}`;
      context.accept('error', errorMessage, pipeWrapper.getFromDiagnostic());
      context.accept('error', errorMessage, pipeWrapper.getToDiagnostic());
    }
  }
}
