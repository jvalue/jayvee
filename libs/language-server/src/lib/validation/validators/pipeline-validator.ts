import { ValidationAcceptor, ValidationChecks } from 'langium';

import { JayveeAstType, Pipeline } from '../../ast/generated/ast';
import { collectStartingBlocks } from '../../ast/model-util';
import { JayveeValidator } from '../jayvee-validator';
import {
  generateNonUniqueNameErrorMessage,
  getNodesWithNonUniqueNames,
} from '../validation-util';

export class PipelineValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      Pipeline: [this.checkStartingBlocks, this.checkUniqueBlockNames],
    };
  }

  checkStartingBlocks(
    this: void,
    pipeline: Pipeline,
    accept: ValidationAcceptor,
  ): void {
    const startingBlocks = collectStartingBlocks(pipeline);
    if (startingBlocks.length === 0) {
      accept('error', `An extractor block is required for this pipeline`, {
        node: pipeline,
        property: 'name',
      });
    }
  }

  checkUniqueBlockNames(
    this: void,
    pipeline: Pipeline,
    accept: ValidationAcceptor,
  ): void {
    getNodesWithNonUniqueNames(pipeline.blocks).forEach((block) => {
      accept('error', generateNonUniqueNameErrorMessage(block), {
        node: block,
        property: 'name',
      });
    });
  }
}
