// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationRegistry } from 'langium';

import { JayveeAstType } from '../ast';
import type { JayveeServices } from '../jayvee-module';

import { validateBlockDefinition } from './checks/block-definition';
import { validateColumnLiteral } from './checks/column-literal';
import { validateConstraintDefinition } from './checks/constraint-definition';
import { validateExpression } from './checks/expression';
import { validateJayveeModel } from './checks/jayvee-model';
import { validatePipeDefinition } from './checks/pipe-definition';
import { validatePipelineDefinition } from './checks/pipeline-definition';
import { validatePropertyBody } from './checks/property-body';
import { validateRangeLiteral } from './checks/range-literal';
import { validateRegexLiteral } from './checks/regex-literal';
import { validateValuetypeDefinition } from './checks/valuetype-definition';

/**
 * Registry for validation checks.
 */
export class JayveeValidationRegistry extends ValidationRegistry {
  constructor(services: JayveeServices) {
    super(services);
    this.register<JayveeAstType>({
      BlockDefinition: validateBlockDefinition,
      ColumnLiteral: validateColumnLiteral,
      ConstraintDefinition: validateConstraintDefinition,
      BooleanExpression: validateExpression,
      JayveeModel: validateJayveeModel,
      PipeDefinition: validatePipeDefinition,
      PipelineDefinition: validatePipelineDefinition,
      PropertyBody: validatePropertyBody,
      RangeLiteral: validateRangeLiteral,
      RegexLiteral: validateRegexLiteral,
      ValuetypeDefinition: validateValuetypeDefinition,
    });
  }
}
