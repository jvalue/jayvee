// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/working-with-the-ast for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { isReference } from 'langium';

import { PipeDefinition } from '../../ast/generated/ast';
import { createSemanticPipes } from '../../ast/wrappers/pipe-wrapper';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
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
    const fromBlockType = semanticPipe.from?.type;
    const toBlockType = semanticPipe.to?.type;

    const fromBlockMetaInf = isReference(fromBlockType)
      ? getMetaInformation(fromBlockType.ref)
      : getMetaInformation(fromBlockType);

    const toBlockMetaInf = isReference(toBlockType)
      ? getMetaInformation(toBlockType.ref)
      : getMetaInformation(toBlockType);

    if (fromBlockMetaInf === undefined || toBlockMetaInf === undefined) {
      continue;
    }

    if (fromBlockMetaInf.hasOutput() && toBlockMetaInf.hasInput()) {
      if (!fromBlockMetaInf.canBeConnectedTo(toBlockMetaInf)) {
        const errorMessage = `The output type "${fromBlockMetaInf.outputType}" of ${fromBlockMetaInf.type} is incompatible with the input type "${toBlockMetaInf.inputType}" of ${toBlockMetaInf.type}`;
        context.accept('error', errorMessage, semanticPipe.getFromDiagnostic());
        context.accept('error', errorMessage, semanticPipe.getToDiagnostic());
      }
    }
  }
}
