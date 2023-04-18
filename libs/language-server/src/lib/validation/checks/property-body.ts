// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import {
  PropertyBody,
  inferTypesFromValue,
  isRuntimeParameterLiteral,
  runtimeParameterAllowedForType,
} from '../../ast';
import { MetaInformation } from '../../meta-information/meta-inf';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

export function validatePropertyBody(
  propertyBody: PropertyBody,
  context: ValidationContext,
): void {
  checkUniqueNames(propertyBody.properties, context);

  const metaInf = inferMetaInformation(propertyBody);
  if (metaInf === undefined) {
    return;
  }
  checkPropertyNames(propertyBody, metaInf, context);
  checkPropertyTyping(propertyBody, metaInf, context);
  checkPropertyCompleteness(propertyBody, metaInf, context);
  if (context.hasErrorOccurred()) {
    return;
  }

  checkCustomPropertyValidation(propertyBody, metaInf, context);
}

function inferMetaInformation(
  propertyBody: PropertyBody,
): MetaInformation | undefined {
  const type = propertyBody.$container.type;
  return getMetaInformation(type);
}

function checkPropertyNames(
  propertyBody: PropertyBody,
  metaInf: MetaInformation,
  context: ValidationContext,
): void {
  for (const property of propertyBody.properties) {
    if (!metaInf.hasPropertySpecification(property.name)) {
      context.accept('error', `Invalid property name "${property.name}".`, {
        node: property,
        property: 'name',
      });
    }
  }
}

function checkPropertyTyping(
  propertyBody: PropertyBody,
  metaInf: MetaInformation,
  context: ValidationContext,
): void {
  for (const property of propertyBody.properties) {
    const propertySpec = metaInf.getPropertySpecification(property.name);
    if (propertySpec === undefined) {
      continue;
    }
    const propertyType = propertySpec.type;

    if (property.value === undefined) {
      continue;
    }
    const propertyValue = property.value;

    if (isRuntimeParameterLiteral(propertyValue)) {
      if (!runtimeParameterAllowedForType(propertyType)) {
        context.accept(
          'error',
          `Runtime parameters are not allowed for properties of type ${propertyType}`,
          {
            node: property,
            property: 'name',
          },
        );
      }
    } else {
      const matchingPropertyTypes = inferTypesFromValue(propertyValue);
      if (!matchingPropertyTypes.includes(propertyType)) {
        context.accept(
          'error',
          `The value needs to be of type ${propertyType}`,
          {
            node: property,
            property: 'value',
          },
        );
      }
    }
  }
}

function checkPropertyCompleteness(
  propertyBody: PropertyBody,
  metaInf: MetaInformation,
  context: ValidationContext,
): void {
  const presentPropertyNames = propertyBody.properties.map(
    (property) => property.name,
  );
  const missingRequiredPropertyNames = metaInf.getPropertyNames(
    'required',
    presentPropertyNames,
  );

  if (missingRequiredPropertyNames.length > 0) {
    context.accept(
      'error',
      `The following required properties are missing: ${missingRequiredPropertyNames
        .map((name) => `"${name}"`)
        .join(', ')}`,
      {
        node: propertyBody.$container,
        property: 'type',
      },
    );
  }
}

function checkCustomPropertyValidation(
  propertyBody: PropertyBody,
  metaInf: MetaInformation,
  context: ValidationContext,
): void {
  metaInf.validate(propertyBody, context);
}
