/**
 * See the FAQ section of README.md for an explanation why the following eslint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ValidationAcceptor, ValidationChecks } from 'langium';

import { JayveeAstType, Pipe } from '../../ast/generated/ast';
import { getMetaInformation } from '../../meta-information/meta-inf-util';
import { JayveeValidator } from '../jayvee-validator';

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
    const fromBlockType = pipe.from?.ref?.type;

    const toBlockType = pipe.to?.ref?.type;

    const fromBlockMetaInf = getMetaInformation(fromBlockType);
    const toBlockMetaInf = getMetaInformation(toBlockType);
    if (fromBlockMetaInf === undefined || toBlockMetaInf === undefined) {
      return;
    }

    if (!fromBlockMetaInf.canBeConnectedTo(toBlockMetaInf)) {
      const errorMessage = `The output of block ${fromBlockMetaInf.blockType} is incompatible with the input of block ${toBlockMetaInf.blockType}`;
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
