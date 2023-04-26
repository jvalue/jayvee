// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

// eslint-disable-next-line import/no-cycle
import { evaluateExpression } from '../../ast/expressions/evaluation';
import { EvaluationStrategy } from '../../ast/expressions/operator-registry';
import {
  Expression,
  PropertyAssignment,
  isExpression,
  isExpressionLiteral,
  isRuntimeParameterLiteral,
} from '../../ast/generated/ast';
import {
  PropertyValuetype,
  inferTypeFromValue,
  runtimeParameterAllowedForType,
} from '../../ast/model-util';
import {
  MetaInformation,
  PropertySpecification,
} from '../../meta-information/meta-inf';
import { ValidationContext } from '../validation-context';

export function validatePropertyAssignment(
  property: PropertyAssignment,
  metaInf: MetaInformation,
  context: ValidationContext,
): void {
  const propertySpec = metaInf.getPropertySpecification(property.name);

  checkPropertyNameValidity(property, propertySpec, context);

  if (propertySpec === undefined) {
    return;
  }
  checkPropertyValueTyping(property, propertySpec, context);
}

function checkPropertyNameValidity(
  property: PropertyAssignment,
  propertySpec: PropertySpecification | undefined,
  context: ValidationContext,
): void {
  if (propertySpec === undefined) {
    context.accept('error', `Invalid property name "${property.name}".`, {
      node: property,
      property: 'name',
    });
  }
}

function checkPropertyValueTyping(
  property: PropertyAssignment,
  propertySpec: PropertySpecification,
  context: ValidationContext,
): void {
  const propertyType = propertySpec.type;

  if (property.value === undefined) {
    return;
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
    return;
  }
  const inferredType = inferTypeFromValue(propertyValue, context);
  if (inferredType === undefined) {
    return;
  }

  const valueIsAssignableToProperty =
    inferredType === propertyType ||
    (inferredType === PropertyValuetype.INTEGER &&
      propertyType === PropertyValuetype.DECIMAL);

  if (!valueIsAssignableToProperty) {
    context.accept(
      'error',
      `The value needs to be of type ${propertyType} but is of type ${inferredType}`,
      {
        node: property,
        property: 'value',
      },
    );
    return;
  }

  if (isExpression(propertyValue)) {
    checkExpressionSimplification(propertyValue, context);
  }
}

function checkExpressionSimplification(
  expression: Expression,
  context: ValidationContext,
): void {
  if (isExpressionLiteral(expression)) {
    return;
  }

  const evaluatedExpression = evaluateExpression(
    expression,
    EvaluationStrategy.EXHAUSTIVE,
    context,
  );
  if (evaluatedExpression !== undefined) {
    context.accept(
      'info',
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `The expression can be simplified to ${evaluatedExpression}`,
      { node: expression },
    );
  }
}
