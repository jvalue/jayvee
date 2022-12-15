import {
  Block,
  BlockType,
  Layout,
  getMetaInformation,
  isIntValue,
  isLayoutReferenceValue,
  isRuntimeParameter,
  isStringValue,
} from '@jayvee/language-server';

import * as R from './execution-result';

export abstract class BlockExecutor<InputType = unknown, OutputType = unknown> {
  private _block?: Block;
  private _runtimeParameters?: Map<string, string | number | boolean>;

  protected constructor(readonly blockType: BlockType) {}

  get block(): Block {
    if (this._block === undefined) {
      throw new Error(
        `No block was set for the executor of block type ${this.blockType}`,
      );
    }
    return this._block;
  }

  set block(block: Block) {
    if (block.type !== this.blockType) {
      throw new Error(
        `The provided block does not match the desired type: expected ${this.blockType}, actual ${block.type}`,
      );
    }
    this._block = block;
  }

  set runtimeParameters(
    runtimeParameters: Map<string, string | number | boolean>,
  ) {
    this._runtimeParameters = runtimeParameters;
  }

  get runtimeParameters(): Map<string, string | number | boolean> {
    if (this._runtimeParameters === undefined) {
      throw new Error(
        `No runtime parameters were set for the executor of block type ${this.blockType}`,
      );
    }
    return this._runtimeParameters;
  }

  abstract execute(input: InputType): Promise<R.Result<OutputType>>;

  protected getLayoutAttributeValue(attributeName: string): Layout {
    const attribute = this.block.attributes.find(
      (attribute) => attribute.name === attributeName,
    );
    if (attribute === undefined) {
      throw new Error(
        `The block "${this.block.name}" of type ${this.block.type} is missing a required attribute called "${attributeName}"`,
      );
    }
    const attributeValue = attribute.value;

    if (isLayoutReferenceValue(attributeValue)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return attributeValue.value.ref!;
    }
    throw new Error(
      `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type layout`,
    );
  }

  protected getStringAttributeValue(attributeName: string): string {
    const attribute = this.block.attributes.find(
      (attribute) => attribute.name === attributeName,
    );
    if (attribute === undefined) {
      const metaInf = getMetaInformation(this.blockType);
      const attributeSpec = metaInf.getAttributeSpecification(attributeName);
      if (attributeSpec === undefined) {
        throw new Error(
          `Attribute with name "${attributeName}" is not allowed in a block of type ${this.blockType}`,
        );
      }
      const defaultValue = attributeSpec.defaultValue;
      if (defaultValue !== undefined) {
        if (typeof defaultValue !== 'string') {
          throw new Error(
            `The default value for attribute "${attributeName}" of block type "${this.block.type}" is unexpectedly not of type string`,
          );
        }
        return defaultValue;
      }

      throw new Error(
        `The block "${this.block.name}" of type ${this.block.type} is missing a required attribute called "${attributeName}"`,
      );
    }
    const attributeValue = attribute.value;

    if (isRuntimeParameter(attributeValue)) {
      const parameterValue = this.runtimeParameters.get(attributeValue.name);
      if (typeof parameterValue !== 'string') {
        throw Error(
          `Runtime parameter ${attributeValue.name} is unexpectedly not of type string.`,
        );
      }
      return parameterValue;
    }
    if (isStringValue(attributeValue)) {
      return attributeValue.value;
    }
    throw new Error(
      `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type string`,
    );
  }

  protected getIntAttributeValue(attributeName: string): number {
    const attribute = this.block.attributes.find(
      (attribute) => attribute.name === attributeName,
    );
    if (attribute === undefined) {
      const metaInf = getMetaInformation(this.blockType);
      const attributeSpec = metaInf.getAttributeSpecification(attributeName);
      if (attributeSpec === undefined) {
        throw new Error(
          `Attribute with name "${attributeName}" is not allowed in a block of type ${this.blockType}`,
        );
      }
      const defaultValue = attributeSpec.defaultValue;
      if (defaultValue !== undefined) {
        if (typeof defaultValue !== 'number') {
          throw new Error(
            `The default value for attribute "${attributeName}" of block type "${this.block.type}" is unexpectedly not of type number`,
          );
        }
        return defaultValue;
      }

      throw new Error(
        `The block "${this.block.name}" of type ${this.block.type} is missing a required attribute called "${attributeName}"`,
      );
    }
    const attributeValue = attribute.value;

    if (isRuntimeParameter(attributeValue)) {
      const parameterValue = this.runtimeParameters.get(attributeValue.name);
      if (typeof parameterValue !== 'number') {
        throw Error(
          `Runtime parameter ${attributeValue.name} is unexpectedly not of type number.`,
        );
      }
      return parameterValue;
    }
    if (isIntValue(attributeValue)) {
      return attributeValue.value;
    }
    throw new Error(
      `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type number`,
    );
  }
}
