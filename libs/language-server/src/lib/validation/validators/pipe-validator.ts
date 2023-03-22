import { ValidationAcceptor, ValidationChecks } from 'langium';

import { JayveeAstType, PipeDefinition } from '../../ast/generated/ast';
import { createSemanticPipes } from '../../ast/wrappers/pipe-wrapper';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { JayveeValidator } from '../jayvee-validator';

export class PipeValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      PipeDefinition: this.checkBlockCompatibility,
    };
  }

  checkBlockCompatibility(
    this: void,
    pipe: PipeDefinition,
    accept: ValidationAcceptor,
  ): void {
    const semanticPipes = createSemanticPipes(pipe);
    for (const semanticPipe of semanticPipes) {
      const fromBlockType = semanticPipe.from.type;
      const toBlockType = semanticPipe.to.type;

      const fromBlockMetaInf = getMetaInformation(fromBlockType);
      const toBlockMetaInf = getMetaInformation(toBlockType);
      if (fromBlockMetaInf === undefined || toBlockMetaInf === undefined) {
        continue;
      }

      if (fromBlockMetaInf.hasOutput() && toBlockMetaInf.hasInput()) {
        if (!fromBlockMetaInf.canBeConnectedTo(toBlockMetaInf)) {
          const errorMessage = `The output type "${fromBlockMetaInf.outputType}" of ${fromBlockMetaInf.type} is incompatible with the input type "${toBlockMetaInf.inputType}" of ${toBlockMetaInf.type}`;
          accept('error', errorMessage, semanticPipe.getFromDiagnostic());
          accept('error', errorMessage, semanticPipe.getToDiagnostic());
        }
      }
    }
  }
}
