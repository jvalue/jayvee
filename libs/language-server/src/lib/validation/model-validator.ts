import { ValidationAcceptor, ValidationChecks } from 'langium';

import { JayveeAstType, Model } from '../ast/generated/ast';

import { JayveeValidator } from './jayvee-validator';
import { getNodesWithNonUniqueNames } from './validation-util';

export class ModelValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      Model: [this.checkUniquePipelineNames, this.checkUniqueLayoutNames],
    };
  }

  checkUniquePipelineNames(
    this: void,
    model: Model,
    accept: ValidationAcceptor,
  ): void {
    getNodesWithNonUniqueNames(model.pipelines).forEach((pipeline) => {
      accept(
        'error',
        `The pipeline name "${pipeline.name}" needs to be unique.`,
        {
          node: pipeline,
          property: 'name',
        },
      );
    });
  }

  checkUniqueLayoutNames(
    this: void,
    model: Model,
    accept: ValidationAcceptor,
  ): void {
    getNodesWithNonUniqueNames(model.layouts).forEach((layout) => {
      accept('error', `The layout name "${layout.name}" needs to be unique.`, {
        node: layout,
        property: 'name',
      });
    });
  }
}
