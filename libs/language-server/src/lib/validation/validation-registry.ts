// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AstNode,
  type MaybePromise,
  type ValidationAcceptor,
  type ValidationCheck,
  ValidationRegistry,
} from 'langium';

import { type JayveeAstType } from '../ast/generated/ast.js';
import {
  EvaluationContext,
  type OperatorEvaluatorRegistry,
  type OperatorTypeComputerRegistry,
  type ValueTypeProvider,
  type WrapperFactoryProvider,
} from '../ast/index.js';
import type { JayveeServices } from '../jayvee-module.js';
import { type RuntimeParameterProvider } from '../services/index.js';

import { validateBlockDefinition } from './checks/block-definition.js';
import { validateBlockTypeDefinition } from './checks/block-type-definition.js';
import { validateColumnId } from './checks/column-id.js';
import { validateCompositeBlockTypeDefinition } from './checks/composite-block-type-definition.js';
import { validateExpressionConstraintDefinition } from './checks/expression-constraint-definition.js';
import { validateJayveeModel } from './checks/jayvee-model.js';
import { validatePipeDefinition } from './checks/pipe-definition.js';
import { validatePipelineDefinition } from './checks/pipeline-definition.js';
import { validatePropertyBody } from './checks/property-body.js';
import { validateRangeLiteral } from './checks/range-literal.js';
import { validateRegexLiteral } from './checks/regex-literal.js';
import { validateTransformBody } from './checks/transform-body.js';
import { validateTypedConstraintDefinition } from './checks/typed-constraint-definition.js';
import { validateValueTypeDefinition } from './checks/value-type-definition.js';
import { validateValueTypeReference } from './checks/value-type-reference.js';
import { ValidationContext } from './validation-context.js';

/**
 * Registry for validation checks.
 */
export class JayveeValidationRegistry extends ValidationRegistry {
  private readonly runtimeParameterProvider;
  private readonly typeComputerRegistry: OperatorTypeComputerRegistry;
  private readonly operatorEvaluatorRegistry: OperatorEvaluatorRegistry;
  private readonly wrapperFactories: WrapperFactoryProvider;
  private readonly valueTypeProvider: ValueTypeProvider;

  constructor(services: JayveeServices) {
    super(services);

    this.runtimeParameterProvider = services.RuntimeParameterProvider;
    this.typeComputerRegistry = services.operators.TypeComputerRegistry;
    this.operatorEvaluatorRegistry = services.operators.EvaluatorRegistry;
    this.wrapperFactories = services.WrapperFactories;
    this.valueTypeProvider = services.ValueTypeProvider;

    this.registerJayveeValidationChecks({
      BuiltinBlockTypeDefinition: validateBlockTypeDefinition,
      BlockDefinition: validateBlockDefinition,
      CompositeBlockTypeDefinition: validateCompositeBlockTypeDefinition,
      ColumnId: validateColumnId,
      TypedConstraintDefinition: validateTypedConstraintDefinition,
      ExpressionConstraintDefinition: validateExpressionConstraintDefinition,
      JayveeModel: validateJayveeModel,
      PipeDefinition: validatePipeDefinition,
      PipelineDefinition: validatePipelineDefinition,
      PropertyBody: validatePropertyBody,
      RangeLiteral: validateRangeLiteral,
      RegexLiteral: validateRegexLiteral,
      ValuetypeDefinition: validateValueTypeDefinition,
      ValueTypeReference: validateValueTypeReference,
      TransformBody: validateTransformBody,
    });
  }

  registerJayveeValidationChecks(checksRecord: JayveeValidationChecks) {
    for (const [type, check] of Object.entries(checksRecord)) {
      const wrappedCheck = this.wrapJayveeValidationCheck(
        check as JayveeValidationCheck,
        this.runtimeParameterProvider,
        this.typeComputerRegistry,
        this.operatorEvaluatorRegistry,
        this.wrapperFactories,
        this.valueTypeProvider,
      );

      // TODO: wtf, why is it any??

      this.addEntry(type, {
        // TODO: check whether equivalent to prior doRegister
        // TODO: check if equivalent to prior doRegister
        category: 'built-in', // TODO: check what that entry does
        check: this.wrapValidationException(wrappedCheck, this),
      });
    }
  }

  private wrapJayveeValidationCheck<T extends AstNode = AstNode>(
    check: JayveeValidationCheck<T>,
    runtimeParameterProvider: RuntimeParameterProvider,
    typeComputerRegistry: OperatorTypeComputerRegistry,
    operatorEvaluatorRegistry: OperatorEvaluatorRegistry,
    wrapperFactories: WrapperFactoryProvider,
    valueTypeProvider: ValueTypeProvider,
  ): ValidationCheck<T> {
    return (node: T, accept: ValidationAcceptor): MaybePromise<void> => {
      const validationContext = new ValidationContext(
        accept,
        typeComputerRegistry,
      );
      const evaluationContext = new EvaluationContext(
        runtimeParameterProvider,
        operatorEvaluatorRegistry,
        valueTypeProvider,
      );
      return check(node, {
        validationContext: validationContext,
        evaluationContext: evaluationContext,
        wrapperFactories: wrapperFactories,
        valueTypeProvider: valueTypeProvider,
      });
    };
  }
}

export type JayveeValidationChecks<T = JayveeAstType> = {
  [K in keyof T]?: T[K] extends AstNode ? JayveeValidationCheck<T[K]> : never;
} & {
  AstNode?: ValidationCheck<AstNode>;
};

export interface JayveeValidationProps {
  validationContext: ValidationContext;
  evaluationContext: EvaluationContext;
  wrapperFactories: WrapperFactoryProvider;
  valueTypeProvider: ValueTypeProvider;
}
export type JayveeValidationCheck<T extends AstNode = AstNode> = (
  node: T,
  props: JayveeValidationProps,
) => MaybePromise<void>;
