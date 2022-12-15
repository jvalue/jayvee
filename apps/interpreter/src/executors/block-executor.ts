import {
  Block,
  BlockType,
  Layout,
  getMetaInformation,
  isLayout,
  isRuntimeParameter,
} from '@jayvee/language-server';
import { isReference } from 'langium';

import * as R from './utils/execution-result';

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

  protected getStringAttributeValue(attributeName: string): string {
    const attributeValue = this.getAttributeValue(attributeName);
    if (typeof attributeValue !== 'string') {
      throw new Error(
        `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type string`,
      );
    }
    return attributeValue;
  }

  protected getIntAttributeValue(attributeName: string): number {
    const attributeValue = this.getAttributeValue(attributeName);
    if (typeof attributeValue !== 'number') {
      throw new Error(
        `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type string`,
      );
    }
    return attributeValue;
  }

  protected getLayoutAttributeValue(attributeName: string): Layout {
    const attributeValue = this.getAttributeValue(attributeName);
    if (!isLayout(attributeValue)) {
      throw new Error(
        `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type layout`,
      );
    }
    return attributeValue;
  }

  private getAttributeValue(attributeName: string): unknown {
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
      if (defaultValue === undefined) {
        throw new Error(
          `The block "${this.block.name}" of type ${this.block.type} is missing a required attribute called "${attributeName}"`,
        );
      }
      return defaultValue;
    }
    const attributeValue = attribute.value;

    if (isRuntimeParameter(attributeValue)) {
      return this.runtimeParameters.get(attributeValue.name);
    }
    const value = attributeValue.value;
    if (isReference(value)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return value.ref!;
    }
    return value;
  }
}
