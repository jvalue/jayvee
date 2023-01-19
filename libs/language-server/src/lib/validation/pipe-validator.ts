import { ValidationAcceptor, ValidationChecks } from 'langium';

import { JayveeAstType, Pipe } from '../ast/generated/ast';
import { getMetaInformation } from '../meta-information/meta-inf-util';

import { JayveeValidator } from './jayvee-validator';

export class PipeValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      Pipe: this.checkBlockCompatibility,
    };
  }

  checkBlockCompatibility(
    this: void,
    pipe: Pipe,
    accept: ValidationAcceptor,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const fromBlock = pipe.from?.ref;
    if (fromBlock === undefined) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const toBlock = pipe.to?.ref;
    if (toBlock === undefined) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (fromBlock.type === undefined || toBlock.type === undefined) {
      return;
    }

    const fromBlockMetaInf = getMetaInformation(fromBlock.type);
    const toBlockMetaInf = getMetaInformation(toBlock.type);
    if (fromBlockMetaInf === undefined || toBlockMetaInf === undefined) {
      return;
    }

    if (!fromBlockMetaInf.canBeConnectedTo(toBlockMetaInf)) {
      const errorMessage = `The output of block ${fromBlock.type} is incompatible with the input of block ${toBlock.type}`;
      accept('error', errorMessage, {
        node: pipe,
        property: 'from',
      });
      accept('error', errorMessage, {
        node: pipe,
        property: 'to',
      });
    }
  }
}
