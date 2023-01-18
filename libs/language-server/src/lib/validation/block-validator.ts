import { ValidationAcceptor, ValidationChecks } from 'langium';
import { assertUnreachable } from 'langium/lib/utils/errors';

import {
  AttributeValue,
  Block,
  JayveeAstType,
  Pipe,
  isIntValue,
  isLayoutReferenceValue,
  isRuntimeParameter,
  isStringValue,
} from '../ast/generated/ast';
import { collectIngoingPipes, collectOutgoingPipes } from '../ast/model-util';
import { AttributeType } from '../meta-information/block-meta-inf';
import { getMetaInformation } from '../meta-information/meta-inf-util';

import { JayveeValidator } from './jayvee-validator';
import {
  generateNonUniqueNameErrorMessage,
  getNodesWithNonUniqueNames,
} from './validation-util';

export class BlockValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      Block: [
        this.checkAttributeNames,
        this.checkUniqueAttributeNames,
        this.checkAttributeTyping,
        this.checkAttributeCompleteness,
        this.checkIngoingPipes,
        this.checkOutgoingPipes,
        this.checkBlockType,
      ],
    };
  }

  checkAttributeNames(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    const blockMetaInf = getMetaInformation(block.type);
    if (blockMetaInf === undefined) {
      return;
    }
    for (const attribute of block.attributes) {
      if (!blockMetaInf.hasAttributeSpecification(attribute.name)) {
        accept('error', `Invalid attribute name "${attribute.name}".`, {
          node: attribute,
          property: 'name',
        });
      }
    }
  }

  checkUniqueAttributeNames(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    getNodesWithNonUniqueNames(block.attributes).forEach((attribute) => {
      accept('error', generateNonUniqueNameErrorMessage(attribute), {
        node: attribute,
        property: 'name',
      });
    });
  }

  checkAttributeTyping(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    const blockMetaInf = getMetaInformation(block.type);
    if (blockMetaInf === undefined) {
      return;
    }

    for (const attribute of block.attributes) {
      const attributeSpec = blockMetaInf.getAttributeSpecification(
        attribute.name,
      );
      if (attributeSpec !== undefined) {
        const attributeType = attributeSpec.type;
        const attributeValue = attribute.value;

        if (isRuntimeParameter(attributeValue)) {
          if (!BlockValidator.runtimeParameterAllowedForType(attributeType)) {
            accept(
              'error',
              `Runtime parameters are not allowed for attributes of type ${attributeType}`,
              {
                node: attribute,
                property: 'name',
              },
            );
          }
        } else {
          const valueType =
            BlockValidator.convertAttributeValueToType(attributeValue);
          if (valueType !== attributeType) {
            accept('error', `The value needs to be of type ${attributeType}`, {
              node: attribute,
              property: 'value',
            });
          }
        }
      }
    }
  }

  private static runtimeParameterAllowedForType(type: AttributeType): boolean {
    switch (type) {
      case AttributeType.LAYOUT:
        return false;
      case AttributeType.STRING:
      case AttributeType.INT:
        return true;
      default:
        assertUnreachable(type);
    }
  }

  private static convertAttributeValueToType(
    value: AttributeValue,
  ): AttributeType {
    if (isStringValue(value)) {
      return AttributeType.STRING;
    }
    if (isIntValue(value)) {
      return AttributeType.INT;
    }
    if (isLayoutReferenceValue(value)) {
      return AttributeType.LAYOUT;
    }
    assertUnreachable(value);
  }

  checkAttributeCompleteness(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    const blockMetaInf = getMetaInformation(block.type);
    if (blockMetaInf === undefined) {
      return;
    }

    const presentAttributeNames = block.attributes.map(
      (attribute) => attribute.name,
    );
    const missingRequiredAttributeNames = blockMetaInf.getAttributeNames(
      'required',
      presentAttributeNames,
    );

    if (missingRequiredAttributeNames.length > 0) {
      accept(
        'error',
        `The following required attributes are missing: ${missingRequiredAttributeNames
          .map((name) => `"${name}"`)
          .join(', ')}`,
        {
          node: block,
          property: 'type',
        },
      );
    }
  }

  checkIngoingPipes(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    BlockValidator.checkPipesOfBlock(block, 'input', accept);
  }

  checkOutgoingPipes(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    BlockValidator.checkPipesOfBlock(block, 'output', accept);
  }

  private static checkPipesOfBlock(
    block: Block,
    whatToCheck: 'input' | 'output',
    accept: ValidationAcceptor,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (block.type === undefined) {
      return;
    }

    const blockMetaInf = getMetaInformation(block.type);
    if (blockMetaInf === undefined) {
      return;
    }

    let pipes: Pipe[];
    switch (whatToCheck) {
      case 'input': {
        pipes = collectIngoingPipes(block);
        break;
      }
      case 'output': {
        pipes = collectOutgoingPipes(block);
        break;
      }
    }

    if (
      (whatToCheck === 'input' && !blockMetaInf.hasInput()) ||
      (whatToCheck === 'output' && !blockMetaInf.hasOutput())
    ) {
      for (const pipe of pipes) {
        accept(
          'error',
          `Blocks of type ${block.type} do not have an ${whatToCheck}`,
          {
            node: pipe,
            property: whatToCheck === 'input' ? 'to' : 'from',
          },
        );
      }
    } else if (pipes.length > 1 && whatToCheck === 'input') {
      for (const pipe of pipes) {
        accept(
          'error',
          `At most one pipe can be connected to the ${whatToCheck} of a ${block.type}`,
          {
            node: pipe,
            property: 'to',
          },
        );
      }
    } else if (pipes.length === 0) {
      accept(
        'warning',
        `A pipe should be connected to the ${whatToCheck} of this block`,
        {
          node: block,
          property: 'name',
        },
      );
    }
  }

  checkBlockType(this: void, block: Block, accept: ValidationAcceptor): void {
    const metaInf = getMetaInformation(block.type);
    if (metaInf === undefined) {
      accept('error', `Unknown block type '${block.type}'`, {
        node: block,
        property: 'type',
      });
    }
  }
}
