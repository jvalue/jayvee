/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {
  ValidationAcceptor,
  ValidationChecks,
  assertUnreachable,
} from 'langium';

import {
  BlockDefinition,
  JayveeAstType,
  collectIngoingPipes,
  collectOutgoingPipes,
} from '../../ast';
import { PipeWrapper } from '../../ast/wrappers/pipe-wrapper';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { JayveeValidator } from '../jayvee-validator';

export class BlockValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      BlockDefinition: [
        this.checkIngoingPipes,
        this.checkOutgoingPipes,
        this.checkBlockType,
      ],
    };
  }

  checkIngoingPipes(
    this: void,
    block: BlockDefinition,
    accept: ValidationAcceptor,
  ): void {
    BlockValidator.checkPipesOfBlock(block, 'input', accept);
  }

  checkOutgoingPipes(
    this: void,
    block: BlockDefinition,
    accept: ValidationAcceptor,
  ): void {
    BlockValidator.checkPipesOfBlock(block, 'output', accept);
  }

  private static checkPipesOfBlock(
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

  checkBlockType(
    this: void,
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
}
