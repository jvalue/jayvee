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
    const fromBlockType = pipe.from?.ref?.type;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const toBlockType = pipe.to?.ref?.type;

    if (fromBlockType === undefined || toBlockType === undefined) {
      return;
    }

    const fromBlockMetaInf = getMetaInformation(fromBlockType);
    const toBlockMetaInf = getMetaInformation(toBlockType);
    if (fromBlockMetaInf === undefined || toBlockMetaInf === undefined) {
      return;
    }

    if (!fromBlockMetaInf.canBeConnectedTo(toBlockMetaInf)) {
      const errorMessage = `The output of block ${fromBlockType.name} is incompatible with the input of block ${toBlockType.name}`;
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
