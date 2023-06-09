// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockDefinition,
  CellRangeWrapper,
  ConstraintDefinition,
  EvaluationContext,
  Expression,
  PipelineDefinition,
  PrimitiveValuetypes,
  PropertyAssignment,
  TransformDefinition,
  Valuetype,
  ValuetypeAssignment,
  evaluateExpression,
  getOrFailMetaInformation,
  isCollectionLiteral,
  isExpression,
  isExpressionConstraintDefinition,
  isPipelineDefinition,
  isPropertyBody,
  isRuntimeParameterLiteral,
  isTransformDefinition,
  isValuetypeAssignment,
} from '@jvalue/jayvee-language-server';
import { assertUnreachable } from 'langium';

import { Logger } from './logger';

export type StackNode =
  | BlockDefinition
  | ConstraintDefinition
  | TransformDefinition;

export class ExecutionContext {
  private readonly stack: StackNode[] = [];

  constructor(
    public readonly pipeline: PipelineDefinition,
    public readonly logger: Logger,
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
    this.logger.setLoggingContext(this.getCurrentNode().name);
  }

  public getTextPropertyValue(propertyName: string): string {
    const propertyValue = this.getPropertyValue(
      propertyName,
      PrimitiveValuetypes.Text,
    );
    assert(typeof propertyValue === 'string');

    return propertyValue;
  }

  public getDecimalPropertyValue(propertyName: string): number {
    const propertyValue = this.getPropertyValue(
      propertyName,
      PrimitiveValuetypes.Decimal,
    );
    assert(typeof propertyValue === 'number');

    return propertyValue;
  }

  public getIntegerPropertyValue(propertyName: string): number {
    const propertyValue = this.getPropertyValue(
      propertyName,
      PrimitiveValuetypes.Integer,
    );
    assert(typeof propertyValue === 'number');

    return propertyValue;
  }

  public getBooleanPropertyValue(propertyName: string): boolean {
    const propertyValue = this.getPropertyValue(
      propertyName,
      PrimitiveValuetypes.Boolean,
    );
    assert(typeof propertyValue === 'boolean');

    return propertyValue;
  }

  public getRegexPropertyValue(propertyName: string): RegExp {
    const propertyValue = this.getPropertyValue(
      propertyName,
      PrimitiveValuetypes.Regex,
    );
    assert(propertyValue instanceof RegExp);

    return propertyValue;
  }

  public getCellRangePropertyValue(propertyName: string): CellRangeWrapper {
    const propertyValue = this.getPropertyValue(
      propertyName,
      PrimitiveValuetypes.CellRange,
    );
    assert(propertyValue instanceof CellRangeWrapper);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return propertyValue;
  }

  public getTransformPropertyValue(propertyName: string): TransformDefinition {
    const propertyValue = this.getPropertyValue(
      propertyName,
      PrimitiveValuetypes.Transform,
    );
    assert(isTransformDefinition(propertyValue));

    return propertyValue;
  }

  public getExpressionCollectionPropertyValue(
    propertyName: string,
  ): Expression[] {
    const propertyValue = this.getPropertyValue(
      propertyName,
      PrimitiveValuetypes.Collection,
    );
    assert(Array.isArray(propertyValue));
    assert(propertyValue.every(isExpression));

    return propertyValue;
  }

  public getCellRangeCollectionPropertyValue(
    propertyName: string,
  ): CellRangeWrapper[] {
    const propertyValue = this.getPropertyValue(
      propertyName,
      PrimitiveValuetypes.Collection,
    );
    assert(Array.isArray(propertyValue));
    assert(propertyValue.every(isExpression));

    const evaluatedExpressions = propertyValue.map((x) =>
      evaluateExpression(x, this.evaluationContext),
    );
    assert(
      evaluatedExpressions.every(
        (x): x is CellRangeWrapper => x instanceof CellRangeWrapper,
      ),
    );

    return evaluatedExpressions;
  }

  public getValuetypeAssignmentCollectionPropertyValue(
    propertyName: string,
  ): ValuetypeAssignment[] {
    const propertyValue = this.getPropertyValue(
      propertyName,
      PrimitiveValuetypes.Collection,
    );
    assert(Array.isArray(propertyValue));
    assert(propertyValue.every(isExpression));

    const evaluatedExpressions = propertyValue.map((x) =>
      evaluateExpression(x, this.evaluationContext),
    );
    assert(evaluatedExpressions.every(isValuetypeAssignment));
    return evaluatedExpressions;
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

  private getPropertyValue(
    propertyName: string,
    valuetype: Valuetype,
  ): unknown {
    const property = this.getProperty(propertyName);

    if (property === undefined) {
      return this.getDefaultPropertyValue(propertyName);
    }
    const propertyValue = property.value;

    if (isRuntimeParameterLiteral(propertyValue)) {
      return this.evaluationContext.getValueForRuntimeParameter(
        propertyValue.name,
        valuetype,
      );
    }
    if (isCollectionLiteral(propertyValue)) {
      return propertyValue.values;
    }
    if (isExpression(propertyValue)) {
      return evaluateExpression(propertyValue, this.evaluationContext);
    }
    assertUnreachable(propertyValue);
  }

  private getDefaultPropertyValue(propertyName: string): unknown {
    const currentNode = this.getCurrentNode();
    assert(!isPipelineDefinition(currentNode));
    assert(!isExpressionConstraintDefinition(currentNode));

    if (isTransformDefinition(currentNode)) {
      return undefined;
    }

    const metaInf = getOrFailMetaInformation(currentNode.type);
    const propertySpec = metaInf.getPropertySpecification(propertyName);
    assert(propertySpec !== undefined);

    const defaultValue = propertySpec.defaultValue;
    assert(defaultValue !== undefined);

    return defaultValue;
  }
}
