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
  isRowWrapper,
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
import {
  checkExpressionSimplification,
  checkUniqueNames,
} from '../validation-util';

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
    case 'HttpExtractor':
      return checkHttpExtractorProperty(
        propName,
        propValue,
        property,
        validationContext,
      );
    case 'RowDeleter':
      return checkRowDeleterProperty(
        propName,
        property,
        validationContext,
        evaluationContext,
      );
    case 'TableInterpreter':
      return checkTableInterpreterProperty(
        propName,
        property,
        validationContext,
        evaluationContext,
      );
    case 'TextFileInterpreter':
      return checkTextFileInterpreterProperty(
        propName,
        propValue,
        property,
        validationContext,
      );
    case 'TextLineDeleter':
      return checkTextLineDeleterProperty(
        propName,
        property,
        validationContext,
        evaluationContext,
      );
    case 'TextRangeSelector':
      return checkTextRangeSelectorProperty(
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
          property: 'value',
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
          property: 'value',
        },
      );
    }
  }
}

function checkHttpExtractorProperty(
  propName: string,
  propValue: InternalValueRepresentation,
  property: PropertyAssignment,
  validationContext: ValidationContext,
) {
  if (propName === 'retries') {
    const minRetryValue = 0;
    if (
      propValue !== undefined &&
      typeof propValue === 'number' &&
      propValue < minRetryValue
    ) {
      validationContext.accept(
        'error',
        `The value of property "${propName}" must not be smaller than ${minRetryValue}`,
        {
          node: property,
          property: 'value',
        },
      );
    }
  }
  if (propName === 'retryBackoffMilliseconds') {
    const minBackoffValue = 1000;
    if (
      propValue !== undefined &&
      typeof propValue === 'number' &&
      propValue < minBackoffValue
    ) {
      validationContext.accept(
        'error',
        `The value of property "${propName}" must not be smaller than ${minBackoffValue}`,
        {
          node: property,
          property: 'value',
        },
      );
    }
  }
  if (propName === 'retryBackoffStrategy') {
    const allowedRetryStrategies: InternalValueRepresentation[] = [
      'exponential',
      'linear',
    ];
    if (
      propValue !== undefined &&
      !allowedRetryStrategies.includes(propValue)
    ) {
      validationContext.accept(
        'error',
        `The value of property "${propName}" must be one of the following values: ${allowedRetryStrategies
          .map((v) => `"${v.toString()}"`)
          .join(', ')}`,
        {
          node: property,
          property: 'value',
        },
      );
    }
  }
}

function checkRowDeleterProperty(
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
      if (!isRowWrapper(cellRange)) {
        validationContext.accept(
          'error',
          'An entire row needs to be selected',
          {
            node: cellRange.astNode,
          },
        );
      }
    });
  }
}

function checkTableInterpreterProperty(
  propName: string,
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  if (propName === 'columns') {
    const valuetypeAssignments = evaluatePropertyValue(
      property,
      evaluationContext,
      new CollectionValuetype(PrimitiveValuetypes.ValuetypeAssignment),
    );
    if (valuetypeAssignments === undefined) {
      return;
    }

    checkUniqueNames(valuetypeAssignments, validationContext, 'column');
  }
}

function checkTextFileInterpreterProperty(
  propName: string,
  propValue: InternalValueRepresentation,
  property: PropertyAssignment,
  validationContext: ValidationContext,
) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings
  const allowedEncodings: InternalValueRepresentation[] = [
    'utf8',
    'ibm866',
    'latin2',
    'latin3',
    'latin4',
    'cyrillic',
    'arabic',
    'greek',
    'hebrew',
    'logical',
    'latin6',
    'utf-16',
  ];
  if (propName === 'encoding') {
    if (!allowedEncodings.includes(propValue)) {
      validationContext.accept(
        'error',
        `The value of property "${propName}" must be one of the following values: ${allowedEncodings
          .map((v) => `"${v.toString()}"`)
          .join(', ')}`,
        {
          node: property,
          property: 'value',
        },
      );
    }
  }
}

function checkTextLineDeleterProperty(
  propName: string,
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  if (propName === 'lines') {
    const minTextLineIndex = 1;
    const lines = evaluatePropertyValue(
      property,
      evaluationContext,
      new CollectionValuetype(PrimitiveValuetypes.Integer),
    );
    lines?.forEach((value, index) => {
      if (value < minTextLineIndex) {
        validationContext.accept(
          'error',
          `Line numbers need to be greater than zero`,
          {
            node: property.value,
            property: 'values',
            index: index,
          },
        );
      }
    });
  }
}

function checkTextRangeSelectorProperty(
  propName: string,
  propValue: InternalValueRepresentation,
  property: PropertyAssignment,
  validationContext: ValidationContext,
) {
  const minLineIndex = 1;
  if (propName === 'lineFrom' || propName === 'lineTo') {
    if (
      propValue !== undefined &&
      typeof propValue === 'number' &&
      propValue < minLineIndex
    ) {
      validationContext.accept(
        'error',
        `The value of property "${propName}" must not be smaller than ${minLineIndex}`,
        {
          node: property,
          property: 'value',
        },
      );
    }
  }
}
