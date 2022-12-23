import { strict as assert } from 'assert';

import {
  Block,
  Layout,
  getOrFailMetaInformation,
  isLayout,
  isRuntimeParameter,
} from '@jayvee/language-server';
import { isReference } from 'langium';

import * as R from './execution-result';
import { ExecutionErrorDetails } from './execution-result';

export abstract class BlockExecutor<InputType = unknown, OutputType = unknown> {
  private _block?: Block;
  private _runtimeParameters?: Map<string, string | number | boolean>;
  private errors: ExecutionErrorDetails[] = [];

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
      block.type === this.blockType,
      `The provided block does not match the desired type: expected ${this.blockType}, actual ${block.type}`,
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

  protected getLayoutAttributeValue(attributeName: string): Layout {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      isLayout(attributeValue),
      `The value of attribute "${attributeName}" in block "${this.block.name}" is unexpectedly not of type layout`,
    );

    return attributeValue;
  }

  private getAttributeValue(attributeName: string): unknown {
    const attribute = this.block.attributes.find(
      (attribute) => attribute.name === attributeName,
    );
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
        `The block "${this.block.name}" of type ${this.block.type} is missing a required attribute called "${attributeName}"`,
      );

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

  protected reportError(errDetails: ExecutionErrorDetails) {
    this.errors.push(errDetails);
  }

  public getReportedErrors(): ExecutionErrorDetails[] {
    return this.errors;
  }
}
