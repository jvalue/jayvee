// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AstNode,
  MaybePromise,
  ValidationAcceptor,
  ValidationCheck,
  ValidationRegistry,
} from 'langium';

import { JayveeAstType } from '../ast/generated/ast';
import type { JayveeServices } from '../jayvee-module';

import { validateBlockDefinition } from './checks/block-definition';
import { validateColumnId } from './checks/column-id';
import { validateExpressionConstraintDefinition } from './checks/expression-constraint-definition';
import { validateJayveeModel } from './checks/jayvee-model';
import { validatePipeDefinition } from './checks/pipe-definition';
import { validatePipelineDefinition } from './checks/pipeline-definition';
import { validatePropertyBody } from './checks/property-body';
import { validateRangeLiteral } from './checks/range-literal';
import { validateRegexLiteral } from './checks/regex-literal';
import { validateTransformBody } from './checks/transform-body';
import { validateTypedConstraintDefinition } from './checks/typed-constraint-definition';
import { validateValuetypeDefinition } from './checks/valuetype-definition';
import { ValidationContext } from './validation-context';

/**
 * Registry for validation checks.
 */
export class JayveeValidationRegistry extends ValidationRegistry {
  constructor(services: JayveeServices) {
    super(services);

    this.register<JayveeAstType>({
      BlockDefinition: wrapCheck(validateBlockDefinition),
      ColumnId: wrapCheck(validateColumnId),
      TypedConstraintDefinition: wrapCheck(validateTypedConstraintDefinition),
      ExpressionConstraintDefinition: wrapCheck(
        validateExpressionConstraintDefinition,
      ),
      JayveeModel: wrapCheck(validateJayveeModel),
      PipeDefinition: wrapCheck(validatePipeDefinition),
      PipelineDefinition: wrapCheck(validatePipelineDefinition),
      PropertyBody: wrapCheck(validatePropertyBody),
      RangeLiteral: wrapCheck(validateRangeLiteral),
      RegexLiteral: wrapCheck(validateRegexLiteral),
      ValuetypeDefinition: wrapCheck(validateValuetypeDefinition),
      TransformBody: wrapCheck(validateTransformBody),
    });
  }
}

type JayveeValidationCheck<T extends AstNode = AstNode> = (
  node: T,
  context: ValidationContext,
) => MaybePromise<void>;

function wrapCheck<T extends AstNode = AstNode>(
  check: JayveeValidationCheck<T>,
): ValidationCheck<T> {
  return (node: T, accept: ValidationAcceptor): MaybePromise<void> => {
    const context = new ValidationContext(accept);
    return check(node, context);
  };
}
