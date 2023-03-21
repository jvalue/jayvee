/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { ValidationAcceptor, ValidationChecks } from 'langium';

import {
  AttributeBody,
  JayveeAstType,
  inferTypesFromValue,
  isRuntimeParameter,
  runtimeParameterAllowedForType,
} from '../../ast';
import { MetaInformation } from '../../meta-information/meta-inf';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { JayveeValidator } from '../jayvee-validator';
import {
  generateNonUniqueNameErrorMessage,
  getNodesWithNonUniqueNames,
} from '../validation-util';

export class AttributeBodyValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      AttributeBody: [
        this.checkAttributeNames,
        this.checkUniqueAttributeNames,
        this.checkAttributeTyping,
        this.checkAttributeCompleteness,
        this.checkCustomAttributeValidation,
      ],
    };
  }

  checkAttributeNames(
    this: void,
    attributeBody: AttributeBody,
    accept: ValidationAcceptor,
  ): void {
    const metaInf = inferMetaInformation(attributeBody);
    if (metaInf === undefined) {
      return;
    }
    for (const attribute of attributeBody.attributes) {
      if (!metaInf.hasAttributeSpecification(attribute.name)) {
        accept('error', `Invalid attribute name "${attribute.name}".`, {
          node: attribute,
          property: 'name',
        });
      }
    }
  }

  checkUniqueAttributeNames(
    this: void,
    attributeBody: AttributeBody,
    accept: ValidationAcceptor,
  ): void {
    getNodesWithNonUniqueNames(attributeBody.attributes).forEach(
      (attribute) => {
        accept('error', generateNonUniqueNameErrorMessage(attribute), {
          node: attribute,
          property: 'name',
        });
      },
    );
  }

  checkAttributeTyping(
    this: void,
    attributeBody: AttributeBody,
    accept: ValidationAcceptor,
  ): void {
    const metaInf = inferMetaInformation(attributeBody);
    if (metaInf === undefined) {
      return;
    }

    for (const attribute of attributeBody.attributes) {
      const attributeSpec = metaInf.getAttributeSpecification(attribute.name);
      if (attributeSpec === undefined) {
        continue;
      }
      const attributeType = attributeSpec.type;

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
        const matchingAttributeTypes = inferTypesFromValue(attributeValue);
        if (!matchingAttributeTypes.includes(attributeType)) {
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
    attributeBody: AttributeBody,
    accept: ValidationAcceptor,
  ): void {
    const metaInf = inferMetaInformation(attributeBody);
    if (metaInf === undefined) {
      return;
    }

    const presentAttributeNames = attributeBody.attributes.map(
      (attribute) => attribute.name,
    );
    const missingRequiredAttributeNames = metaInf.getAttributeNames(
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
          node: attributeBody.$container,
          property: 'type',
        },
      );
    }
  }

  checkCustomAttributeValidation(
    this: void,
    attributeBody: AttributeBody,
    accept: ValidationAcceptor,
  ): void {
    const metaInf = inferMetaInformation(attributeBody);
    if (metaInf === undefined) {
      return;
    }
    metaInf.validate(attributeBody.attributes, accept);
  }
}

function inferMetaInformation(
  attributeBody: AttributeBody,
): MetaInformation | undefined {
  const type = attributeBody.$container.type;
  return getMetaInformation(type);
}
