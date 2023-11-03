// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockDefinition,
  BlockTypeWrapper,
  ConstraintDefinition,
  ConstraintTypeWrapper,
  EvaluationContext,
  InternalValueRepresentation,
  PipelineDefinition,
  PropertyAssignment,
  TransformDefinition,
  Valuetype,
  evaluatePropertyValue,
  isBlockDefinition,
  isExpressionConstraintDefinition,
  isPipelineDefinition,
  isPropertyBody,
  isTransformDefinition,
  isTypedConstraintDefinition,
} from '@jvalue/jayvee-language-server';
import { assertUnreachable, isReference } from 'langium';

import {
  DebugGranularity,
  DebugTargets,
} from './debugging/debug-configuration';
import { Logger } from './logging/logger';

export type StackNode =
  | BlockDefinition
  | ConstraintDefinition
  | TransformDefinition;

export class ExecutionContext {
  private readonly stack: StackNode[] = [];

  constructor(
    public readonly pipeline: PipelineDefinition,
    public readonly logger: Logger,
    public readonly runOptions: {
      isDebugMode: boolean;
      debugGranularity: DebugGranularity;
      debugTargets: DebugTargets;
    },
    public readonly evaluationContext: EvaluationContext,
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

  public getPropertyValue<I extends InternalValueRepresentation>(
    propertyName: string,
    valuetype: Valuetype<I>,
  ): I {
    const property = this.getProperty(propertyName);

    if (property === undefined) {
      return this.getDefaultPropertyValue(propertyName, valuetype);
    }

    const propertyValue = evaluatePropertyValue(
      property,
      this.evaluationContext,
      valuetype,
    );
    assert(propertyValue !== undefined);
    return propertyValue;
  }

  public getProperty(propertyName: string): PropertyAssignment | undefined {
    const currentNode = this.getCurrentNode();
    if (
      isPipelineDefinition(currentNode) ||
      isExpressionConstraintDefinition(currentNode)
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

  private getDefaultPropertyValue<I extends InternalValueRepresentation>(
    propertyName: string,
    valuetype: Valuetype<I>,
  ): I {
    const wrapper = this.getWrapperOfCurrentNode();
    const propertySpec = wrapper.getPropertySpecification(propertyName);
    assert(propertySpec !== undefined);

    const defaultValue = propertySpec.defaultValue;
    assert(defaultValue !== undefined);
    assert(valuetype.isInternalValueRepresentation(defaultValue));

    return defaultValue;
  }

  private getWrapperOfCurrentNode() {
    const currentNode = this.getCurrentNode();
    assert(!isPipelineDefinition(currentNode));
    assert(!isExpressionConstraintDefinition(currentNode));
    assert(!isTransformDefinition(currentNode));

    assert(isReference(currentNode.type));
    if (isTypedConstraintDefinition(currentNode)) {
      assert(
        ConstraintTypeWrapper.canBeWrapped(currentNode.type),
        `ConstraintType ${
          currentNode.type.ref?.name ?? '<unresolved reference>'
        } cannot be wrapped`,
      );
      return new ConstraintTypeWrapper(currentNode.type);
    } else if (isBlockDefinition(currentNode)) {
      assert(
        BlockTypeWrapper.canBeWrapped(currentNode.type),
        `Blocktype ${
          currentNode.type.ref?.name ?? '<unresolved reference>'
        } cannot be wrapped`,
      );
      return new BlockTypeWrapper(currentNode.type);
    }
    assertUnreachable(currentNode);
  }
}
