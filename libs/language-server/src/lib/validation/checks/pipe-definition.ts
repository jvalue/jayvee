// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { type PipeDefinition } from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validatePipeDefinition(
  pipe: PipeDefinition,
  props: JayveeValidationProps,
): void {
  checkBlockCompatibility(pipe, props);
}

function checkBlockCompatibility(
  pipe: PipeDefinition,
  props: JayveeValidationProps,
): void {
  const pipeWrappers = props.wrapperFactories.Pipe.wrapAll(pipe);
  for (const pipeWrapper of pipeWrappers) {
    const fromBlockTypeDefinition = pipeWrapper.from?.type;
    const toBlockTypeDefinition = pipeWrapper.to?.type;

    if (
      !props.wrapperFactories.BlockType.canWrap(fromBlockTypeDefinition) ||
      !props.wrapperFactories.BlockType.canWrap(toBlockTypeDefinition)
    ) {
      continue;
    }
    const fromBlockType = props.wrapperFactories.BlockType.wrap(
      fromBlockTypeDefinition,
    );
    const toBlockType = props.wrapperFactories.BlockType.wrap(
      toBlockTypeDefinition,
    );

    const isFromBlockLoader = !fromBlockType.hasOutput();
    const isToBlockExtractor = !toBlockType.hasInput();

    if (isFromBlockLoader) {
      const errorMessage = `Block "${pipeWrapper.from?.name}" cannot be connected to other blocks. Its block type "${fromBlockType.astNode.name}" has output type "${fromBlockType.outputType}".`;
      props.validationContext.accept(
        'error',
        errorMessage,
        pipeWrapper.getFromDiagnostic(),
      );
    }

    if (isToBlockExtractor) {
      const errorMessage = `Block "${pipeWrapper.to?.name}" cannot be connected to from other blocks. Its block type "${toBlockType.astNode.name}" has input type "${toBlockType.inputType}".`;
      props.validationContext.accept(
        'error',
        errorMessage,
        pipeWrapper.getToDiagnostic(),
      );
    }

    if (!fromBlockType.canBeConnectedTo(toBlockType)) {
      const errorMessage = `The output type "${fromBlockType.outputType}" of block "${pipeWrapper.from?.name}" (of type "${fromBlockType.astNode.name}") is not compatible with the input type "${toBlockType.inputType}" of block "${pipeWrapper.to?.name}" (of type "${toBlockType.astNode.name}")`;
      props.validationContext.accept(
        'error',
        errorMessage,
        pipeWrapper.getFromDiagnostic(),
      );
      props.validationContext.accept(
        'error',
        errorMessage,
        pipeWrapper.getToDiagnostic(),
      );
    }
  }
}
