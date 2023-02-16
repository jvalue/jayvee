import { ValidationAcceptor, ValidationChecks } from 'langium';

import {
  Block,
  JayveeAstType,
  Pipe,
  collectIngoingPipes,
  collectOutgoingPipes,
  convertAttributeValueToType,
  isRuntimeParameter,
  runtimeParameterAllowedForType,
} from '../ast';
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
        this.checkBlockTypeSpecificValidation,
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
      if (attributeSpec === undefined) {
        continue;
      }
      const attributeType = attributeSpec.type;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (attribute.value === undefined) {
        continue;
      }
      const attributeValue = attribute.value;

      if (isRuntimeParameter(attributeValue)) {
        if (!runtimeParameterAllowedForType(attributeType)) {
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
        const valueType = convertAttributeValueToType(attributeValue);
        if (valueType !== attributeType) {
          accept('error', `The value needs to be of type ${attributeType}`, {
            node: attribute,
            property: 'value',
          });
        }
      }
    }
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
          `Blocks of type ${block.type.name} do not have an ${whatToCheck}`,
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
          `At most one pipe can be connected to the ${whatToCheck} of a ${block.type.name}`,
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
      accept('error', `Unknown block type '${block.type.name}'`, {
        node: block,
        property: 'type',
      });
    }
  }

  checkBlockTypeSpecificValidation(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    const metaInf = getMetaInformation(block.type);
    if (metaInf === undefined) {
      return;
    }
    metaInf.validate(block, accept);
  }
}
