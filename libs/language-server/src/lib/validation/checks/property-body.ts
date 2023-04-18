// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ValidationAcceptor } from 'langium';

import {
  PropertyBody,
  inferTypesFromValue,
  isRuntimeParameterLiteral,
  runtimeParameterAllowedForType,
} from '../../ast';
import { MetaInformation } from '../../meta-information/meta-inf';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { checkUniqueNames } from '../validation-util';

export function validatePropertyBody(
  propertyBody: PropertyBody,
  accept: ValidationAcceptor,
): void {
  checkPropertyNames(propertyBody, accept);
  checkUniqueNames(propertyBody.properties, accept);
  checkPropertyTyping(propertyBody, accept);
  checkPropertyCompleteness(propertyBody, accept);
  checkCustomPropertyValidation(propertyBody, accept);
}

function checkPropertyNames(
  propertyBody: PropertyBody,
  accept: ValidationAcceptor,
): void {
  const metaInf = inferMetaInformation(propertyBody);
  if (metaInf === undefined) {
    return;
  }
  for (const property of propertyBody.properties) {
    if (!metaInf.hasPropertySpecification(property.name)) {
      accept('error', `Invalid property name "${property.name}".`, {
        node: property,
        property: 'name',
      });
    }
  }
}

function checkPropertyTyping(
  propertyBody: PropertyBody,
  accept: ValidationAcceptor,
): void {
  const metaInf = inferMetaInformation(propertyBody);
  if (metaInf === undefined) {
    return;
  }

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
        accept(
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
        accept('error', `The value needs to be of type ${propertyType}`, {
          node: property,
          property: 'value',
        });
      }
    }
  }
}

function checkPropertyCompleteness(
  propertyBody: PropertyBody,
  accept: ValidationAcceptor,
): void {
  const metaInf = inferMetaInformation(propertyBody);
  if (metaInf === undefined) {
    return;
  }

  const presentPropertyNames = propertyBody.properties.map(
    (property) => property.name,
  );
  const missingRequiredPropertyNames = metaInf.getPropertyNames(
    'required',
    presentPropertyNames,
  );

  if (missingRequiredPropertyNames.length > 0) {
    accept(
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
  accept: ValidationAcceptor,
): void {
  const metaInf = inferMetaInformation(propertyBody);
  if (metaInf === undefined) {
    return;
  }
  metaInf.validate(propertyBody, accept);
}

function inferMetaInformation(
  propertyBody: PropertyBody,
): MetaInformation | undefined {
  const type = propertyBody.$container.type;
  return getMetaInformation(type);
}
