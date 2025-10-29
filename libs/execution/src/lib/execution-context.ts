// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';
import { inspect } from 'node:util';

import {
  type BlockDefinition,
  type ConstraintDefinition,
  ERROR_TYPEGUARD,
  type EvaluationContext,
  type InternalValidValueRepresentation,
  type PipelineDefinition,
  type PropertyAssignment,
  type TransformDefinition,
  type ValueType,
  type ValueTypeConstraintInlineDefinition,
  type ValueTypeProvider,
  type WrapperFactoryProvider,
  evaluatePropertyValue,
  isBlockDefinition,
  isConstraintDefinition,
  isPipelineDefinition,
  isPropertyBody,
  isTransformDefinition,
  isValueTypeConstraintInlineDefinition,
} from '@jvalue/jayvee-language-server';
import { isReference } from 'langium';

import { type Result } from './blocks';
import {
  type DebugGranularity,
  type DebugTargets,
} from './debugging/debug-configuration';
import { type JayveeExecExtension } from './extension';
import { type HookContext } from './hooks';
import { type Logger } from './logging/logger';
import { type IOTypeImplementation } from './types';

export type StackNode =
  | BlockDefinition
  | ConstraintDefinition
  | TransformDefinition
  | ValueTypeConstraintInlineDefinition;

export class ExecutionContext {
  private readonly stack: StackNode[] = [];

  constructor(
    public readonly pipeline: PipelineDefinition,
    public readonly executionExtension: JayveeExecExtension,
    public readonly logger: Logger,
    public readonly wrapperFactories: WrapperFactoryProvider,
    public readonly valueTypeProvider: ValueTypeProvider,
    public readonly runOptions: {
      isDebugMode: boolean;
      debugGranularity: DebugGranularity;
      debugTargets: DebugTargets;
    },
    public readonly evaluationContext: EvaluationContext,
    public readonly hookContext: HookContext,
  ) {
    logger.setLoggingContext(pipeline.name);
  }

  public enterNode(node: StackNode) {
    this.stack.push(node);

    this.updateLoggingContext();
  }

  public exitNode(node: StackNode) {
    const poppedNode = this.stack.pop();
    assert(poppedNode === node);

    this.updateLoggingContext();
  }

  /**
   * @returns the latest stack node. Returns the pipeline if the stack is empty.
   */
  public getCurrentNode(): StackNode | PipelineDefinition {
    const currentNode = this.stack[this.stack.length - 1];
    if (currentNode === undefined) {
      return this.pipeline;
    }

    return currentNode;
  }

  private updateLoggingContext() {
    this.logger.setLoggingDepth(this.stack.length);
    this.logger.setLoggingContext(this.getCurrentNode().name);
  }

  public getPropertyValue<I extends InternalValidValueRepresentation>(
    propertyName: string,
    valueType: ValueType<I>,
  ): I {
    const property = this.getProperty(propertyName);

    if (property === undefined) {
      return this.getDefaultPropertyValue(propertyName, valueType);
    }

    const propertyValue = evaluatePropertyValue(
      property,
      this.evaluationContext,
      this.wrapperFactories,
      valueType,
    );
    assert(!ERROR_TYPEGUARD(propertyValue));
    return propertyValue;
  }

  public getProperty(propertyName: string): PropertyAssignment | undefined {
    const currentNode = this.getCurrentNode();
    if (
      isPipelineDefinition(currentNode) ||
      isConstraintDefinition(currentNode) ||
      isValueTypeConstraintInlineDefinition(currentNode)
    ) {
      return undefined;
    }

    const body = currentNode.body;
    if (!isPropertyBody(body)) {
      return undefined;
    }

    return body.properties.find((property) => property.name === propertyName);
  }

  public getOrFailProperty(propertyName: string): PropertyAssignment {
    const property = this.getProperty(propertyName);
    assert(property !== undefined);

    return property;
  }

  public executeHooks(
    input: IOTypeImplementation | null,
    output?: Result<IOTypeImplementation | null>,
  ) {
    const node = this.getCurrentNode();
    assert(
      isBlockDefinition(node),
      `Expected node to be \`BlockDefinition\`: ${inspect(node)}`,
    );

    const blocktype = node.type.ref?.name;
    assert(
      blocktype !== undefined,
      `Expected block definition to have a blocktype: ${inspect(node)}`,
    );

    if (output === undefined) {
      return this.hookContext.executePreBlockHooks({
        blocktype,
        input,
        context: this,
      });
    } else {
      return this.hookContext.executePostBlockHooks({
        blocktype,
        input,
        output,
        context: this,
      });
    }
  }

  private getDefaultPropertyValue<I extends InternalValidValueRepresentation>(
    propertyName: string,
    valueType: ValueType<I>,
  ): I {
    const wrapper = this.getWrapperOfCurrentNode();
    const propertySpec = wrapper.getPropertySpecification(propertyName);
    assert(propertySpec !== undefined);

    const defaultValue = propertySpec.defaultValue;
    assert(defaultValue !== undefined);
    assert(valueType.isInternalValidValueRepresentation(defaultValue));

    return defaultValue;
  }

  private getWrapperOfCurrentNode() {
    const currentNode = this.getCurrentNode();
    assert(!isPipelineDefinition(currentNode));
    assert(!isConstraintDefinition(currentNode));
    assert(!isTransformDefinition(currentNode));
    assert(!isValueTypeConstraintInlineDefinition(currentNode));

    assert(isReference(currentNode.type));
    assert(isBlockDefinition(currentNode));
    return this.wrapperFactories.BlockType.wrap(currentNode.type);
  }
}
