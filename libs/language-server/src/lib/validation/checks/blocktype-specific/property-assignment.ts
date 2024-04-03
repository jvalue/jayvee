// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  CollectionValuetype,
  EvaluationContext,
  InternalValueRepresentation,
  PrimitiveValuetypes,
  PropertyAssignment,
  PropertySpecification,
  type WrapperFactory,
  evaluatePropertyValue,
  internalValueToString,
  isColumnWrapper,
  isRowWrapper,
} from '../../../ast';
import { ValidationContext } from '../../validation-context';
import { checkUniqueNames } from '../../validation-util';

export function checkBlocktypeSpecificProperties(
  property: PropertyAssignment,
  propertySpec: PropertySpecification,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
) {
  const propName = property.name;
  const propValue = evaluatePropertyValue(
    property,
    evaluationContext,
    wrapperFactory,
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
        wrapperFactory,
      );
    case 'ColumnDeleter':
      return checkColumnDeleterProperty(
        propName,
        property,
        validationContext,
        evaluationContext,
        wrapperFactory,
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
    case 'LocalFileExtractor':
      return checkLocalFileExtractorProperty(
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
        wrapperFactory,
      );
    case 'TableInterpreter':
      return checkTableInterpreterProperty(
        propName,
        property,
        validationContext,
        evaluationContext,
        wrapperFactory,
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
        wrapperFactory,
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
    checkPropertyValueOneOf(
      propValue,
      allowedArchiveTypes,
      propName,
      property,
      validationContext,
    );
  }
}

function checkCellWriterProperty(
  propName: string,
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
) {
  if (propName === 'at') {
    const cellRange = evaluatePropertyValue(
      property,
      evaluationContext,
      wrapperFactory,
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
  wrapperFactory: WrapperFactory,
) {
  if (propName === 'delete') {
    const cellRanges = evaluatePropertyValue(
      property,
      evaluationContext,
      wrapperFactory,
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
    checkPropertyValueOneOf(
      propValue,
      allowedEntities,
      propName,
      property,
      validationContext,
    );
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
    if (typeof propValue === 'number' && propValue < minRetryValue) {
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
    if (typeof propValue === 'number' && propValue < minBackoffValue) {
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
    checkPropertyValueOneOf(
      propValue,
      allowedRetryStrategies,
      propName,
      property,
      validationContext,
    );
  }
}

function checkLocalFileExtractorProperty(
  propName: string,
  propValue: InternalValueRepresentation,
  property: PropertyAssignment,
  validationContext: ValidationContext,
) {
  if (
    propName === 'filePath' &&
    internalValueToString(propValue).includes('..')
  ) {
    validationContext.accept(
      'error',
      'File path cannot include "..". Path traversal is restricted.',
      {
        node: property,
        property: 'value',
      },
    );
  }
}

function checkRowDeleterProperty(
  propName: string,
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
) {
  if (propName === 'delete') {
    const cellRanges = evaluatePropertyValue(
      property,
      evaluationContext,
      wrapperFactory,
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
  wrapperFactory: WrapperFactory,
) {
  if (propName === 'columns') {
    const valuetypeAssignments = evaluatePropertyValue(
      property,
      evaluationContext,
      wrapperFactory,
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
    checkPropertyValueOneOf(
      propValue,
      allowedEncodings,
      propName,
      property,
      validationContext,
    );
  }
}

function checkTextLineDeleterProperty(
  propName: string,
  property: PropertyAssignment,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
) {
  if (propName === 'lines') {
    const minTextLineIndex = 1;
    const lines = evaluatePropertyValue(
      property,
      evaluationContext,
      wrapperFactory,
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
    if (typeof propValue === 'number' && propValue < minLineIndex) {
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

function checkPropertyValueOneOf(
  propValue: InternalValueRepresentation,
  allowedValues: InternalValueRepresentation[],
  propName: string,
  property: PropertyAssignment,
  validationContext: ValidationContext,
) {
  if (!allowedValues.includes(propValue)) {
    validationContext.accept(
      'error',
      `The value of property "${propName}" must be one of the following values: ${allowedValues
        .map((v) => `${internalValueToString(v)}`)
        .join(', ')}`,
      {
        node: property,
        property: 'value',
      },
    );
  }
}
