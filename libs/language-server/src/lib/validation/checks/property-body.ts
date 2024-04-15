// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { type TypedObjectWrapper } from '../../ast';
import {
  type PropertyAssignment,
  type PropertyBody,
  isBlockDefinition,
  isTypedConstraintDefinition,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';
import { checkUniqueNames } from '../validation-util';

import { checkBlockTypeSpecificPropertyBody } from './block-type-specific/property-body';
import { checkConstraintTypeSpecificPropertyBody } from './constrainttype-specific/property-body';
import { validatePropertyAssignment } from './property-assignment';

export function validatePropertyBody(
  propertyBody: PropertyBody,
  props: JayveeValidationProps,
): void {
  const properties = propertyBody?.properties ?? [];
  checkUniqueNames(properties, props.validationContext);

  const wrapper = inferTypedObjectWrapper(propertyBody, props);
  if (wrapper === undefined) {
    return;
  }

  checkPropertyCompleteness(propertyBody, properties, wrapper, props);
  for (const property of propertyBody.properties) {
    validatePropertyAssignment(property, wrapper, props);
  }
  if (props.validationContext.hasErrorOccurred()) {
    return;
  }

  checkCustomPropertyValidation(propertyBody, wrapper, props);
}

function inferTypedObjectWrapper(
  propertyBody: PropertyBody,
  props: JayveeValidationProps,
): TypedObjectWrapper | undefined {
  const type = propertyBody.$container?.type.ref;
  return props.wrapperFactories.TypedObject.wrap(type);
}

function checkPropertyCompleteness(
  propertyBody: PropertyBody,
  properties: PropertyAssignment[],
  wrapper: TypedObjectWrapper,
  props: JayveeValidationProps,
): void {
  const presentPropertyNames = properties.map((property) => property.name);
  const missingRequiredPropertyNames =
    wrapper.getMissingRequiredPropertyNames(presentPropertyNames);

  if (missingRequiredPropertyNames.length > 0) {
    props.validationContext.accept(
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
  wrapper: TypedObjectWrapper,
  props: JayveeValidationProps,
): void {
  wrapper.validate(
    propertyBody,
    props.validationContext,
    props.evaluationContext,
  );

  if (isBlockDefinition(propertyBody.$container)) {
    checkBlockTypeSpecificPropertyBody(propertyBody, props);
  } else if (isTypedConstraintDefinition(propertyBody.$container)) {
    checkConstraintTypeSpecificPropertyBody(propertyBody, props);
  }
}
