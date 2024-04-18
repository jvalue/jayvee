// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import {
  type PropertySpecification,
  type TypedObjectWrapper,
  inferExpressionType,
} from '../../ast';
import {
  type PropertyAssignment,
  isBlockTypeProperty,
  isRuntimeParameterLiteral,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';
import { checkExpressionSimplification } from '../validation-util';

import { checkBlockTypeSpecificProperties } from './block-type-specific/property-assignment';

export function validatePropertyAssignment(
  property: PropertyAssignment,
  wrapper: TypedObjectWrapper,
  props: JayveeValidationProps,
): void {
  const propertySpec = wrapper.getPropertySpecification(property?.name);

  checkPropertyNameValidity(property, propertySpec, props);

  if (propertySpec === undefined) {
    return;
  }
  checkPropertyValueTyping(property, propertySpec, props);

  if (props.validationContext.hasErrorOccurred()) {
    return;
  }

  checkBlockTypeSpecificProperties(property, propertySpec, props);
}

function checkPropertyNameValidity(
  property: PropertyAssignment,
  propertySpec: PropertySpecification | undefined,
  props: JayveeValidationProps,
): void {
  if (propertySpec === undefined) {
    props.validationContext.accept(
      'error',
      `Invalid property name "${property?.name ?? ''}".`,
      {
        node: property,
        property: 'name',
      },
    );
  }
}

function checkPropertyValueTyping(
  property: PropertyAssignment,
  propertySpec: PropertySpecification,
  props: JayveeValidationProps,
): void {
  const propertyType = propertySpec.type;
  const propertyValue = property?.value;
  if (propertyValue === undefined) {
    return;
  }

  if (isRuntimeParameterLiteral(propertyValue)) {
    if (!propertyType.isAllowedAsRuntimeParameter()) {
      props.validationContext.accept(
        'error',
        `Runtime parameters are not allowed for properties of type ${propertyType.getName()}`,
        {
          node: propertyValue,
        },
      );
    }
    return;
  }

  if (isBlockTypeProperty(propertyValue)) {
    return;
  }

  const inferredType = inferExpressionType(
    propertyValue,
    props.validationContext,
    props.valueTypeProvider,
    props.wrapperFactories,
  );
  if (inferredType === undefined) {
    return;
  }

  if (!inferredType.isConvertibleTo(propertyType)) {
    props.validationContext.accept(
      'error',
      `The value of property "${
        property.name
      }" needs to be of type ${propertyType.getName()} but is of type ${inferredType.getName()}`,
      {
        node: propertyValue,
      },
    );
    return;
  }

  checkExpressionSimplification(propertyValue, props);
}
