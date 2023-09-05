// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import {
  CollectionValuetype,
  EvaluationContext,
  InternalValueRepresentation,
  PrimitiveValuetypes,
  evaluatePropertyValue,
  inferExpressionType,
  isColumnWrapper,
} from '../../ast';
import {
  PropertyAssignment,
  isBlocktypeProperty,
  isRuntimeParameterLiteral,
} from '../../ast/generated/ast';
import {
  MetaInformation,
  PropertySpecification,
} from '../../meta-information/meta-inf';
import { ValidationContext } from '../validation-context';
import { checkExpressionSimplification } from '../validation-util';

export function validatePropertyAssignment(
  property: PropertyAssignment,
  metaInf: MetaInformation,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  const propertySpec = metaInf.getPropertySpecification(property?.name);

  checkPropertyNameValidity(property, propertySpec, validationContext);

  if (propertySpec === undefined) {
    return;
  }
  checkPropertyValueTyping(
    property,
    propertySpec,
    validationContext,
    evaluationContext,
  );

  if (validationContext.hasErrorOccurred()) {
    return;
  }

  checkBlocktypeSpecificProperties(
    property,
    propertySpec,
    validationContext,
    evaluationContext,
  );
}

function checkPropertyNameValidity(
  property: PropertyAssignment,
  propertySpec: PropertySpecification | undefined,
  context: ValidationContext,
): void {
  if (propertySpec === undefined) {
    context.accept(
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
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  const propertyType = propertySpec.type;
  const propertyValue = property?.value;
  if (propertyValue === undefined) {
    return;
  }

  if (isRuntimeParameterLiteral(propertyValue)) {
    if (!propertyType.isAllowedAsRuntimeParameter()) {
      validationContext.accept(
        'error',
        `Runtime parameters are not allowed for properties of type ${propertyType.getName()}`,
        {
          node: propertyValue,
        },
      );
    }
    return;
  }

  if (isBlocktypeProperty(propertyValue)) {
    return;
  }

  const inferredType = inferExpressionType(propertyValue, validationContext);
  if (inferredType === undefined) {
    return;
  }

  if (!inferredType.isConvertibleTo(propertyType)) {
    validationContext.accept(
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

  checkExpressionSimplification(
    propertyValue,
    validationContext,
    evaluationContext,
  );
}

function checkBlocktypeSpecificProperties(
  property: PropertyAssignment,
  propertySpec: PropertySpecification,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  const propName = property.name;
  const propValue = evaluatePropertyValue(
    property,
    evaluationContext,
    propertySpec.type,
  );
  if (propValue === undefined) {
    return;
  }

  switch (property.$container.$container.type.ref?.name) {
    case 'ArchiveInterpreter':
      return checkArchiveInterpreterProperty(
        propName,
        propValue,
        property,
        validationContext,
      );
    case 'CellWriter':
      return checkCellWriterProperty(
        propName,
        property,
        validationContext,
        evaluationContext,
      );
    case 'ColumnDeleter':
      return checkColumnDeleterProperty(
        propName,
        property,
        validationContext,
        evaluationContext,
      );
    case 'GtfsRTInterpreter':
      return checkGtfsRTInterpreterProperty(
        propName,
        propValue,
        property,
        validationContext,
      );
    default:
  }
}

function checkArchiveInterpreterProperty(
  propName: string,
  propValue: InternalValueRepresentation,
  property: PropertyAssignment,
  validationContext: ValidationContext,
) {
  const allowedArchiveTypes: InternalValueRepresentation[] = ['zip', 'gz'];
  if (propName === 'archiveType') {
    if (!allowedArchiveTypes.includes(propValue)) {
      validationContext.accept(
        'error',
        `The value of property "${propName}" must be one of the following values: ${allowedArchiveTypes
          .map((v) => `"${v.toString()}"`)
          .join(', ')}`,
        {
          node: property,
        },
      );
    }
  }
}

function checkCellWriterProperty(
  propName: string,
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  if (propName === 'at') {
    const cellRange = evaluatePropertyValue(
      property,
      evaluationContext,
      PrimitiveValuetypes.CellRange,
    );
    if (cellRange === undefined) {
      return;
    }

    if (!cellRange.isOneDimensional()) {
      validationContext.accept(
        'error',
        'The cell range needs to be one-dimensional',
        {
          node: cellRange.astNode,
        },
      );
    }
  }
}

function checkColumnDeleterProperty(
  propName: string,
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  if (propName === 'delete') {
    const cellRanges = evaluatePropertyValue(
      property,
      evaluationContext,
      new CollectionValuetype(PrimitiveValuetypes.CellRange),
    );

    cellRanges?.forEach((cellRange) => {
      if (!isColumnWrapper(cellRange)) {
        validationContext.accept(
          'error',
          'An entire column needs to be selected',
          {
            node: cellRange.astNode,
          },
        );
      }
    });
  }
}

function checkGtfsRTInterpreterProperty(
  propName: string,
  propValue: InternalValueRepresentation,
  property: PropertyAssignment,
  validationContext: ValidationContext,
) {
  const allowedEntities: InternalValueRepresentation[] = [
    'trip_update',
    'alert',
    'vehicle',
  ];
  if (propName === 'entity') {
    if (!allowedEntities.includes(propValue)) {
      validationContext.accept(
        'error',
        `The value of property "${propName}" must be one of the following values: ${allowedEntities
          .map((v) => `"${v.toString()}"`)
          .join(', ')}`,
        {
          node: property,
        },
      );
    }
  }
}
