// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ValidationAcceptor, assertUnreachable } from 'langium';

import {
  BlockDefinition,
  collectIngoingPipes,
  collectOutgoingPipes,
} from '../../ast';
import { PipeWrapper } from '../../ast/wrappers/pipe-wrapper';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';

export function validateBlockDefinition(
  block: BlockDefinition,
  accept: ValidationAcceptor,
): void {
  checkBlockType(block, accept);
  checkPipesOfBlock(block, 'input', accept);
  checkPipesOfBlock(block, 'output', accept);
}

function checkBlockType(
  block: BlockDefinition,
  accept: ValidationAcceptor,
): void {
  if (block.type === undefined) {
    return;
  }
  const metaInf = getMetaInformation(block.type);
  if (metaInf === undefined) {
    accept('error', `Unknown block type '${block?.type?.name ?? ''}'`, {
      node: block,
      property: 'type',
    });
  }
}

function checkPipesOfBlock(
  block: BlockDefinition,
  whatToCheck: 'input' | 'output',
  accept: ValidationAcceptor,
): void {
  const blockMetaInf = getMetaInformation(block.type);
  if (blockMetaInf === undefined) {
    return;
  }

  let pipes: PipeWrapper[];
  switch (whatToCheck) {
    case 'input': {
      pipes = collectIngoingPipes(block);
      break;
    }
    case 'output': {
      pipes = collectOutgoingPipes(block);
      break;
    }
    default: {
      assertUnreachable(whatToCheck);
    }
  }

  if (
    (whatToCheck === 'input' && !blockMetaInf.hasInput()) ||
    (whatToCheck === 'output' && !blockMetaInf.hasOutput())
  ) {
    for (const pipe of pipes) {
      accept(
        'error',
        `Blocks of type ${blockMetaInf.type} do not have an ${whatToCheck}`,
        whatToCheck === 'input'
          ? pipe.getToDiagnostic()
          : pipe.getFromDiagnostic(),
      );
    }
  } else if (pipes.length > 1 && whatToCheck === 'input') {
    for (const pipe of pipes) {
      accept(
        'error',
        `At most one pipe can be connected to the ${whatToCheck} of a ${blockMetaInf.type}`,
        pipe.getToDiagnostic(),
      );
    }
  } else if (pipes.length === 0) {
    accept(
      'warning',
      `A pipe should be connected to the ${whatToCheck} of this block`,
      {
        node: block,
        property: 'name',
      },
    );
  }
}
