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

import { JayveeAstType } from '../ast/generated/ast.js';
import { EvaluationContext } from '../ast/index.js';
import type { JayveeServices } from '../jayvee-module.js';
import { RuntimeParameterProvider } from '../services/index.js';

import { validateBlockDefinition } from './checks/block-definition.js';
import { validateBlocktypeDefinition } from './checks/blocktype-definition.js';
import { validateColumnId } from './checks/column-id.js';
import { validateCompositeBlockTypeDefinition } from './checks/composite-blocktype-definition.js';
import { validateExpressionConstraintDefinition } from './checks/expression-constraint-definition.js';
import { validateJayveeModel } from './checks/jayvee-model.js';
import { validatePipeDefinition } from './checks/pipe-definition.js';
import { validatePipelineDefinition } from './checks/pipeline-definition.js';
import { validatePropertyBody } from './checks/property-body.js';
import { validateRangeLiteral } from './checks/range-literal.js';
import { validateRegexLiteral } from './checks/regex-literal.js';
import { validateTransformBody } from './checks/transform-body.js';
import { validateTypedConstraintDefinition } from './checks/typed-constraint-definition.js';
import { validateValuetypeDefinition } from './checks/valuetype-definition.js';
import { validateValuetypeReference } from './checks/valuetype-reference.js';
import { ValidationContext } from './validation-context.js';

/**
 * Registry for validation checks.
 */
export class JayveeValidationRegistry extends ValidationRegistry {
  private readonly runtimeParameterProvider;
  constructor(services: JayveeServices) {
    super(services);

    this.runtimeParameterProvider = services.RuntimeParameterProvider;

    this.registerJayveeValidationChecks({
      BuiltinBlocktypeDefinition: validateBlocktypeDefinition,
      BlockDefinition: validateBlockDefinition,
      CompositeBlocktypeDefinition: validateCompositeBlockTypeDefinition,
      ColumnId: validateColumnId,
      TypedConstraintDefinition: validateTypedConstraintDefinition,
      ExpressionConstraintDefinition: validateExpressionConstraintDefinition,
      JayveeModel: validateJayveeModel,
      PipeDefinition: validatePipeDefinition,
      PipelineDefinition: validatePipelineDefinition,
      PropertyBody: validatePropertyBody,
      RangeLiteral: validateRangeLiteral,
      RegexLiteral: validateRegexLiteral,
      ValuetypeDefinition: validateValuetypeDefinition,
      ValuetypeReference: validateValuetypeReference,
      TransformBody: validateTransformBody,
    });
  }

  registerJayveeValidationChecks(checksRecord: JayveeValidationChecks) {
    for (const [type, check] of Object.entries(checksRecord)) {
      const wrappedCheck = this.wrapJayveeValidationCheck(
        check as JayveeValidationCheck,
        this.runtimeParameterProvider,
      );

      this.addEntry(type, { check: wrappedCheck, category: 'fast' }); // TODO: make sure this still works after upgrade to Langium 2.0
    }
  }

  private wrapJayveeValidationCheck<T extends AstNode = AstNode>(
    check: JayveeValidationCheck<T>,
    runtimeParameterProvider: RuntimeParameterProvider,
  ): ValidationCheck<T> {
    return (node: T, accept: ValidationAcceptor): MaybePromise<void> => {
      const validationContext = new ValidationContext(accept);
      const evaluationContext = new EvaluationContext(runtimeParameterProvider);
      return check(node, validationContext, evaluationContext);
    };
  }
}

export type JayveeValidationChecks<T = JayveeAstType> = {
  [K in keyof T]?: T[K] extends AstNode ? JayveeValidationCheck<T[K]> : never;
} & {
  AstNode?: ValidationCheck<AstNode>;
};

export type JayveeValidationCheck<T extends AstNode = AstNode> = (
  node: T,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) => MaybePromise<void>;
