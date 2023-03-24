// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationAcceptor, ValidationChecks } from 'langium';

import { JayveeAstType, JayveeModel } from '../../ast/generated/ast';
import { JayveeValidator } from '../jayvee-validator';
import {
  generateNonUniqueNameErrorMessage,
  getNodesWithNonUniqueNames,
} from '../validation-util';

export class JayveeModelValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      JayveeModel: [this.checkUniquePipelineDefinitionNames],
    };
  }

  checkUniquePipelineDefinitionNames(
    this: void,
    model: JayveeModel,
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
