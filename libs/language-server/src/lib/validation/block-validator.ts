import { ValidationAcceptor, ValidationChecks } from 'langium';

import {
  Block,
  CSVFileExtractor,
  JayveeAstType,
  Pipe,
  isRuntimeParameter,
} from '../ast/generated/ast';
import { collectIngoingPipes, collectOutgoingPipes } from '../ast/model-util';
import { getMetaInformation } from '../meta-information/meta-inf-util';

import { JayveeValidator } from './jayvee-validator';

export class BlockValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      Block: [this.checkIngoingPipes, this.checkOutgoingPipes],
      CSVFileExtractor: this.checkUrlFormat,
    };
  }

  checkIngoingPipes(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    BlockValidator.checkPipesOfBlock(block, 'input', accept);
  }

  checkOutgoingPipes(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    BlockValidator.checkPipesOfBlock(block, 'output', accept);
  }

  private static checkPipesOfBlock(
    block: Block,
    whatToCheck: 'input' | 'output',
    accept: ValidationAcceptor,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (block.type === undefined) {
      return;
    }

    const blockMetaInf = getMetaInformation(block.type);

    let pipes: Pipe[];
    switch (whatToCheck) {
      case 'input': {
        pipes = collectIngoingPipes(block);
        break;
      }
      case 'output': {
        pipes = collectOutgoingPipes(block);
        break;
      }
    }

    if (
      (whatToCheck === 'input' && !blockMetaInf.hasInput()) ||
      (whatToCheck === 'output' && !blockMetaInf.hasOutput())
    ) {
      for (const pipe of pipes) {
        accept(
          'error',
          `Blocks of type ${block.type.$type} do not have an ${whatToCheck}`,
          {
            node: pipe,
            property: whatToCheck === 'input' ? 'to' : 'from',
          },
        );
      }
    } else if (pipes.length > 1) {
      for (const pipe of pipes) {
        accept(
          'error',
          `At most one pipe can be connected to the ${whatToCheck} of a ${block.type.$type}`,
          {
            node: pipe,
            property: whatToCheck === 'input' ? 'to' : 'from',
          },
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

  checkUrlFormat(
    this: void,
    csvFileExtractor: CSVFileExtractor,
    accept: ValidationAcceptor,
  ): void {
    const urlAttributeValue = csvFileExtractor.url.value;

    if (isRuntimeParameter(urlAttributeValue)) {
      return;
    }

    const url = urlAttributeValue.value;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (url === undefined) {
      return;
    }

    const urlRegex =
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;
    if (!urlRegex.test(url)) {
      accept('warning', 'The url has an invalid format', {
        node: csvFileExtractor,
        property: 'url',
      });
    }
  }
}
