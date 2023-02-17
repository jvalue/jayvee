import { strict as assert } from 'assert';

import {
  Attribute,
  Block,
  DataTypeAssignment,
  SemanticCellRange,
  getOrFailMetaInformation,
  isCellRange,
  isCellRangeValue,
  isCollection,
  isDataTypeAssignmentValue,
  isRuntimeParameter,
} from '@jayvee/language-server';
import { isReference } from 'langium';

import * as R from './execution-result';
import { Logger } from './logger';

export abstract class BlockExecutor<InputType = unknown, OutputType = unknown> {
  private _block?: Block;
  private _runtimeParameters?: Map<string, string | number | boolean>;
  private _logger?: Logger;

  protected constructor(readonly blockType: string) {}

  get block(): Block {
    assert(
      this._block !== undefined,
      `No block was set for the executor of block type ${this.blockType}`,
    );

    return this._block;
  }

  set block(block: Block) {
    assert(
      block.type.name === this.blockType,
      `The provided block does not match the desired type: expected ${this.blockType}, actual ${block.type.name}`,
    );

    this._block = block;
  }

  set runtimeParameters(
    runtimeParameters: Map<string, string | number | boolean>,
  ) {
    this._runtimeParameters = runtimeParameters;
  }

  get runtimeParameters(): Map<string, string | number | boolean> {
    assert(
      this._runtimeParameters !== undefined,
      `No runtime parameters were set for the executor of block type ${this.blockType}`,
    );

    return this._runtimeParameters;
  }

  set logger(logger: Logger) {
    this._logger = logger;
  }

  get logger(): Logger {
    assert(
      this._logger !== undefined,
      `No logger was set for the executor of block type ${this.blockType}`,
    );

    return this._logger;
  }

  abstract execute(input: InputType): Promise<R.Result<OutputType>>;

  protected getStringAttributeValue(attributeName: string): string {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      typeof attributeValue === 'string',
      `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type string`,
    );

    return attributeValue;
  }

  protected getIntAttributeValue(attributeName: string): number {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      typeof attributeValue === 'number',
      `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type string`,
    );

    return attributeValue;
  }

  protected getBooleanAttributeValue(attributeName: string): boolean {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      typeof attributeValue === 'boolean',
      `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type boolean`,
    );

    return attributeValue;
  }

  protected getCellRangeAttributeValue(
    attributeName: string,
  ): SemanticCellRange {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      isCellRange(attributeValue),
      `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type cell range`,
    );

    return new SemanticCellRange(attributeValue);
  }

  protected getCellRangeCollectionAttributeValue(
    attributeName: string,
  ): SemanticCellRange[] {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      Array.isArray(attributeValue),
      `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type collection`,
    );
    assert(
      attributeValue.every(isCellRangeValue),
      `Some values of attribute "${attributeName}" in block "${this.block.name}" are unexpectedly not of type cell range`,
    );
    return attributeValue.map(
      (cellRange) => new SemanticCellRange(cellRange.value),
    );
  }

  protected getDataTypeAssignmentCollectionAttributeValue(
    attributeName: string,
  ): DataTypeAssignment[] {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      Array.isArray(attributeValue),
      `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type collection`,
    );
    assert(
      attributeValue.every(isDataTypeAssignmentValue),
      `Some values of attribute "${attributeName}" in block "${this.block.name}" are unexpectedly not of type data type assignment`,
    );

    return attributeValue.map((assignment) => assignment.value);
  }

  private getAttributeValue(attributeName: string): unknown {
    const attribute = this.getAttribute(attributeName);
    if (attribute === undefined) {
      const metaInf = getOrFailMetaInformation(this.blockType);

      const attributeSpec = metaInf.getAttributeSpecification(attributeName);
      assert(
        attributeSpec !== undefined,
        `Attribute with name "${attributeName}" is not allowed in a block of type ${this.blockType}`,
      );

      const defaultValue = attributeSpec.defaultValue;
      assert(
        defaultValue !== undefined,
        `The block "${this.block.name}" of type ${this.block.type.name} is missing a required attribute called "${attributeName}"`,
      );

      return defaultValue;
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return value.ref!;
    }
    return value;
  }

  protected getAttribute(attributeName: string): Attribute | undefined {
    return this.block.attributes.find(
      (attribute) => attribute.name === attributeName,
    );
  }

  protected getOrFailAttribute(attributeName: string): Attribute {
    const attribute = this.getAttribute(attributeName);
    assert(
      attribute !== undefined,
      `Attribute with name ${attributeName} was expected to be present in block ${this.block.name} of type ${this.block.type.name}`,
    );
    return attribute;
  }
}
