import { strict as assert } from 'assert';

import {
  Attribute,
  Block,
  Layout,
  getOrFailMetaInformation,
  isLayout,
  isRuntimeParameter,
} from '@jayvee/language-server';
import * as chalk from 'chalk';
import * as O from 'fp-ts/Option';
import { AstNode, DiagnosticInfo, isReference } from 'langium';

import { Logger, Severity } from './logger';

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

  abstract execute(input: InputType): Promise<O.Option<OutputType>>;

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

  protected getAttribute(attributeName: string): Attribute | undefined {
    return this.block.attributes.find(
      (attribute) => attribute.name === attributeName,
    );
  }

  protected getOrFailAttribute(attributeName: string): Attribute {
    const attribute = this.getAttribute(attributeName);
    assert(
      attribute !== undefined,
      `Attribute with name ${attributeName} was expected to be present in block ${this.block.name} of type ${this.block.type}`,
    );
    return attribute;
  }

  protected logErr<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ) {
    this.log('error', message, diagnostic);
  }

  protected logWarn<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ) {
    this.log('warning', message, diagnostic);
  }

  protected logInfo<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ) {
    this.log('info', message, diagnostic);
  }

  protected logHint<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ) {
    this.log('hint', message, diagnostic);
  }

  private log<N extends AstNode>(
    severity: Severity,
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ) {
    this.logger.log(
      severity,
      `${chalk.gray(`[${this.block.name}]`)} ${message}`,
      diagnostic,
    );
  }
}
