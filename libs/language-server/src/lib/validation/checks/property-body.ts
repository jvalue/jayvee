// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { EvaluationContext } from '../../ast/expressions/evaluation';
import { PropertyBody } from '../../ast/generated/ast';
import { MetaInformation } from '../../meta-information/meta-inf';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

import { validatePropertyAssignment } from './property-assignment';

export function validatePropertyBody(
  propertyBody: PropertyBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  checkUniqueNames(propertyBody.properties, validationContext);

  const metaInf = inferMetaInformation(propertyBody);
  if (metaInf === undefined) {
    return;
  }

  checkPropertyCompleteness(propertyBody, metaInf, validationContext);
  for (const property of propertyBody.properties) {
    validatePropertyAssignment(
      property,
      metaInf,
      validationContext,
      evaluationContext,
    );
  }
  if (validationContext.hasErrorOccurred()) {
    return;
  }

  checkCustomPropertyValidation(
    propertyBody,
    metaInf,
    validationContext,
    evaluationContext,
  );
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
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  metaInf.validate(propertyBody, validationContext, evaluationContext);
}
