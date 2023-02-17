import { ValidationAcceptor, ValidationChecks } from 'langium';

import { JayveeAstType, Model } from '../ast/generated/ast';

import { JayveeValidator } from './jayvee-validator';
import {
  generateNonUniqueNameErrorMessage,
  getNodesWithNonUniqueNames,
} from './validation-util';

export class ModelValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      Model: [this.checkUniquePipelineNames],
    };
  }

  checkUniquePipelineNames(
    this: void,
    model: Model,
    accept: ValidationAcceptor,
  ): void {
    getNodesWithNonUniqueNames(model.pipelines).forEach((pipeline) => {
      accept('error', generateNonUniqueNameErrorMessage(pipeline), {
        node: pipeline,
        property: 'name',
      });
    });
  }
}
