import { ValidationAcceptor, ValidationChecks } from 'langium';

// eslint-disable-next-line import/no-cycle
import { Pipe } from '..';
import { JayveeAstType } from '../generated/ast';
import { getMetaInformation } from '../meta-information';

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
    const fromBlock = pipe.from.ref;
    if (fromBlock === undefined) {
      return;
    }

    const toBlock = pipe.to.ref;
    if (toBlock === undefined) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (fromBlock.type === undefined || toBlock.type === undefined) {
      return;
    }

    const fromBlockMetaInf = getMetaInformation(fromBlock.type);
    const toBlockMetaInf = getMetaInformation(toBlock.type);

    if (!fromBlockMetaInf.canBeConnectedTo(toBlockMetaInf)) {
      accept(
        'error',
        `The output of block ${fromBlock.type.$type} is incompatible with the input of block ${toBlock.type.$type}`,
        {
          node: pipe,
        },
      );
    }
  }
}
