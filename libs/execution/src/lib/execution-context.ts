// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockDefinition,
  CellRangeWrapper,
  ConstraintDefinition,
  PipelineDefinition,
  PropertyAssignment,
  TextLiteral,
  ValuetypeAssignment,
  getOrFailMetaInformation,
  isCellRangeLiteral,
  isCollectionLiteral,
  isPipelineDefinition,
  isRuntimeParameterLiteral,
  isTextLiteral,
  isValuetypeAssignmentLiteral,
} from '@jvalue/language-server';
import { isReference } from 'langium';

import { Logger } from './logger';

export type StackNode = BlockDefinition | ConstraintDefinition;

export class ExecutionContext {
  private readonly stack: StackNode[] = [];

  constructor(
    public readonly pipeline: PipelineDefinition,
    public readonly logger: Logger,
    public readonly runtimeParameters: Map<string, string | number | boolean>,
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
    const propertyValue = this.getPropertyValue(propertyName);
    assert(typeof propertyValue === 'string');

    return propertyValue;
  }

  public getNumericPropertyValue(propertyName: string): number {
    const propertyValue = this.getPropertyValue(propertyName);
    assert(typeof propertyValue === 'number');

    return propertyValue;
  }

  public getBooleanPropertyValue(propertyName: string): boolean {
    const propertyValue = this.getPropertyValue(propertyName);
    assert(typeof propertyValue === 'boolean');

    return propertyValue;
  }

  public getRegexPropertyValue(propertyName: string): RegExp {
    const propertyValue = this.getPropertyValue(propertyName);
    assert(typeof propertyValue === 'string');

    return new RegExp(propertyValue);
  }

  public getCellRangePropertyValue(propertyName: string): CellRangeWrapper {
    const propertyValue = this.getPropertyValue(propertyName);
    assert(isCellRangeLiteral(propertyValue));

    return new CellRangeWrapper(propertyValue);
  }

  public getTextCollectionPropertyValue(propertyName: string): TextLiteral[] {
    const propertyValue = this.getPropertyValue(propertyName);
    assert(Array.isArray(propertyValue));
    assert(propertyValue.every(isTextLiteral));

    return propertyValue;
  }

  public getCellRangeCollectionPropertyValue(
    propertyName: string,
  ): CellRangeWrapper[] {
    const propertyValue = this.getPropertyValue(propertyName);
    assert(Array.isArray(propertyValue));
    assert(propertyValue.every(isCellRangeLiteral));

    return propertyValue.map((cellRange) => new CellRangeWrapper(cellRange));
  }

  public getValuetypeAssignmentCollectionPropertyValue(
    propertyName: string,
  ): ValuetypeAssignment[] {
    const propertyValue = this.getPropertyValue(propertyName);
    assert(Array.isArray(propertyValue));
    assert(propertyValue.every(isValuetypeAssignmentLiteral));

    return propertyValue.map((assignment) => assignment.value);
  }

  public getProperty(propertyName: string): PropertyAssignment | undefined {
    const currentNode = this.getCurrentNode();
    if (isPipelineDefinition(currentNode)) {
      return undefined;
    }
    return currentNode.body.properties.find(
      (property) => property.name === propertyName,
    );
  }

  public getOrFailProperty(propertyName: string): PropertyAssignment {
    const property = this.getProperty(propertyName);
    assert(property !== undefined);

    return property;
  }

  private getPropertyValue(propertyName: string): unknown {
    const property = this.getProperty(propertyName);

    if (property === undefined) {
      return this.getDefaultPropertyValue(propertyName);
    }
    const propertyValue = property.value;

    if (isRuntimeParameterLiteral(propertyValue)) {
      return this.runtimeParameters.get(propertyValue.name);
    }
    if (isCollectionLiteral(propertyValue)) {
      return propertyValue.values;
    }
    if (isCellRangeLiteral(propertyValue)) {
      return propertyValue;
    }
    const value = propertyValue.value;
    if (isReference(value)) {
      const reference = value.ref;
      assert(reference !== undefined);

      return reference;
    }
    return value;
  }

  private getDefaultPropertyValue(propertyName: string): unknown {
    const currentNode = this.getCurrentNode();
    assert(!isPipelineDefinition(currentNode));

    const metaInf = getOrFailMetaInformation(currentNode.type);
    const propertySpec = metaInf.getPropertySpecification(propertyName);
    assert(propertySpec !== undefined);

    const defaultValue = propertySpec.defaultValue;
    assert(defaultValue !== undefined);

    return defaultValue;
  }
}
