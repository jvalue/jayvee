// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PropertyBody } from '../../ast/generated/ast';
// eslint-disable-next-line import/no-cycle
import { MetaInformation } from '../../meta-information/meta-inf';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

import { validatePropertyAssignment } from './property-assignment';

export function validatePropertyBody(
  propertyBody: PropertyBody,
  context: ValidationContext,
): void {
  checkUniqueNames(propertyBody.properties, context);

  const metaInf = inferMetaInformation(propertyBody);
  if (metaInf === undefined) {
    return;
  }

  checkPropertyCompleteness(propertyBody, metaInf, context);
  for (const property of propertyBody.properties) {
    validatePropertyAssignment(property, metaInf, context);
  }
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
