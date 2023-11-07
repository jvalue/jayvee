// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { PipeDefinition } from '../../ast/generated/ast';
import { createSemanticPipes } from '../../ast/wrappers/pipe-wrapper';
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
  const semanticPipes = createSemanticPipes(pipe);
  for (const semanticPipe of semanticPipes) {
    const fromBlockTypeDefinition = semanticPipe.from?.type;
    const toBlockTypeDefinition = semanticPipe.to?.type;

    if (
      !BlockTypeWrapper.canBeWrapped(fromBlockTypeDefinition) ||
      !BlockTypeWrapper.canBeWrapped(toBlockTypeDefinition)
    ) {
      continue;
    }
    const fromBlockType = new BlockTypeWrapper(fromBlockTypeDefinition);
    const toBlockType = new BlockTypeWrapper(toBlockTypeDefinition);

    if (fromBlockType.hasOutput() && toBlockType.hasInput()) {
      if (!fromBlockType.canBeConnectedTo(toBlockType)) {
        const errorMessage = `The output type "${fromBlockType.outputType}" of ${fromBlockType.type} is incompatible with the input type "${toBlockType.inputType}" of ${toBlockType.type}`;
        context.accept('error', errorMessage, semanticPipe.getFromDiagnostic());
        context.accept('error', errorMessage, semanticPipe.getToDiagnostic());
      }
    }
  }
}
