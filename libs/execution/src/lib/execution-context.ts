import { strict as assert } from 'assert';

import {
  Attribute,
  Block,
  CellRangeWrapper,
  Constraint,
  Pipeline,
  TextValue,
  ValuetypeAssignment,
  getOrFailMetaInformation,
  isCellRange,
  isCellRangeValue,
  isCollection,
  isPipeline,
  isRuntimeParameter,
  isTextValue,
  isValuetypeAssignmentValue,
} from '@jvalue/language-server';
import { isReference } from 'langium';

import { Logger } from './logger';

export type StackNode = Block | Constraint;

export class ExecutionContext {
  private readonly stack: StackNode[] = [];

  constructor(
    public readonly pipeline: Pipeline,
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

  public getCurrentNode(): StackNode | Pipeline {
    const currentNode = this.stack[this.stack.length - 1];
    if (currentNode === undefined) {
      return this.pipeline;
    }

    return currentNode;
  }

  private updateLoggingContext() {
    this.logger.setLoggingContext(this.getCurrentNode().name);
  }

  public getTextAttributeValue(attributeName: string): string {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(typeof attributeValue === 'string');

    return attributeValue;
  }

  public getNumericAttributeValue(attributeName: string): number {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(typeof attributeValue === 'number');

    return attributeValue;
  }

  public getBooleanAttributeValue(attributeName: string): boolean {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(typeof attributeValue === 'boolean');

    return attributeValue;
  }

  public getRegexAttributeValue(attributeName: string): RegExp {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(typeof attributeValue === 'string');

    return new RegExp(attributeValue);
  }

  public getCellRangeAttributeValue(attributeName: string): CellRangeWrapper {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(isCellRange(attributeValue));

    return new CellRangeWrapper(attributeValue);
  }

  public getTextCollectionAttributeValue(attributeName: string): TextValue[] {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(Array.isArray(attributeValue));
    assert(attributeValue.every(isTextValue));

    return attributeValue;
  }

  public getCellRangeCollectionAttributeValue(
    attributeName: string,
  ): CellRangeWrapper[] {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(Array.isArray(attributeValue));
    assert(attributeValue.every(isCellRangeValue));

    return attributeValue.map(
      (cellRange) => new CellRangeWrapper(cellRange.value),
    );
  }

  public getValuetypeAssignmentCollectionAttributeValue(
    attributeName: string,
  ): ValuetypeAssignment[] {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(Array.isArray(attributeValue));
    assert(attributeValue.every(isValuetypeAssignmentValue));

    return attributeValue.map((assignment) => assignment.value);
  }

  public getAttribute(attributeName: string): Attribute | undefined {
    const currentNode = this.getCurrentNode();
    if (isPipeline(currentNode)) {
      return undefined;
    }
    return currentNode.body.attributes.find(
      (attribute) => attribute.name === attributeName,
    );
  }

  public getOrFailAttribute(attributeName: string): Attribute {
    const attribute = this.getAttribute(attributeName);
    assert(attribute !== undefined);

    return attribute;
  }

  private getAttributeValue(attributeName: string): unknown {
    const attribute = this.getAttribute(attributeName);

    if (attribute === undefined) {
      return this.getDefaultAttributeValue(attributeName);
    }
    const attributeValue = attribute.value;

    if (isRuntimeParameter(attributeValue)) {
      return this.runtimeParameters.get(attributeValue.name);
    }
    if (isCollection(attributeValue)) {
      return attributeValue.values;
    }
    const value = attributeValue.value;
    if (isReference(value)) {
      const reference = value.ref;
      assert(reference !== undefined);

      return reference;
    }
    return value;
  }

  private getDefaultAttributeValue(attributeName: string): unknown {
    const currentNode = this.getCurrentNode();
    assert(!isPipeline(currentNode));

    const metaInf = getOrFailMetaInformation(currentNode.type);
    const attributeSpec = metaInf.getAttributeSpecification(attributeName);
    assert(attributeSpec !== undefined);

    const defaultValue = attributeSpec.defaultValue;
    assert(defaultValue !== undefined);

    return defaultValue;
  }
}
