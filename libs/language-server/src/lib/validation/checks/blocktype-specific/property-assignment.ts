// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  CollectionValuetype,
  InternalValueRepresentation,
  PrimitiveValuetypes,
  PropertyAssignment,
  PropertySpecification,
  evaluatePropertyValue,
  internalValueToString,
  isColumnWrapper,
  isRowWrapper,
} from '../../../ast';
import { type JayveeValidationProps } from '../../validation-registry';
import { checkUniqueNames } from '../../validation-util';

export function checkBlocktypeSpecificProperties(
  property: PropertyAssignment,
  propertySpec: PropertySpecification,
  props: JayveeValidationProps,
) {
  const propName = property.name;
  const propValue = evaluatePropertyValue(
    property,
    props.evaluationContext,
    props.wrapperFactory,
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
        props,
      );
    case 'CellWriter':
      return checkCellWriterProperty(propName, property, props);
    case 'ColumnDeleter':
      return checkColumnDeleterProperty(propName, property, props);
    case 'GtfsRTInterpreter':
      return checkGtfsRTInterpreterProperty(
        propName,
        propValue,
        property,
        props,
      );
    case 'HttpExtractor':
      return checkHttpExtractorProperty(propName, propValue, property, props);
    case 'LocalFileExtractor':
      return checkLocalFileExtractorProperty(
        propName,
        propValue,
        property,
        props,
      );
    case 'RowDeleter':
      return checkRowDeleterProperty(propName, property, props);
    case 'TableInterpreter':
      return checkTableInterpreterProperty(propName, property, props);
    case 'TextFileInterpreter':
      return checkTextFileInterpreterProperty(
        propName,
        propValue,
        property,
        props,
      );
    case 'TextLineDeleter':
      return checkTextLineDeleterProperty(propName, property, props);
    case 'TextRangeSelector':
      return checkTextRangeSelectorProperty(
        propName,
        propValue,
        property,
        props,
      );
    default:
  }
}

function checkArchiveInterpreterProperty(
  propName: string,
  propValue: InternalValueRepresentation,
  property: PropertyAssignment,
  props: JayveeValidationProps,
) {
  const allowedArchiveTypes: InternalValueRepresentation[] = ['zip', 'gz'];
  if (propName === 'archiveType') {
    checkPropertyValueOneOf(
      propValue,
      allowedArchiveTypes,
      propName,
      property,
      props,
    );
  }
}

function checkCellWriterProperty(
  propName: string,
  property: PropertyAssignment,
  props: JayveeValidationProps,
) {
  if (propName === 'at') {
    const cellRange = evaluatePropertyValue(
      property,
      props.evaluationContext,
      props.wrapperFactory,
      PrimitiveValuetypes.CellRange,
    );
    if (cellRange === undefined) {
      return;
    }

    if (!cellRange.isOneDimensional()) {
      props.validationContext.accept(
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
  props: JayveeValidationProps,
) {
  if (propName === 'delete') {
    const cellRanges = evaluatePropertyValue(
      property,
      props.evaluationContext,
      props.wrapperFactory,
      new CollectionValuetype(PrimitiveValuetypes.CellRange),
    );

    cellRanges?.forEach((cellRange) => {
      if (!isColumnWrapper(cellRange)) {
        props.validationContext.accept(
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
  props: JayveeValidationProps,
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
      props,
    );
  }
}

function checkHttpExtractorProperty(
  propName: string,
  propValue: InternalValueRepresentation,
  property: PropertyAssignment,
  props: JayveeValidationProps,
) {
  if (propName === 'retries') {
    const minRetryValue = 0;
    if (typeof propValue === 'number' && propValue < minRetryValue) {
      props.validationContext.accept(
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
      props.validationContext.accept(
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
      props,
    );
  }
}

function checkLocalFileExtractorProperty(
  propName: string,
  propValue: InternalValueRepresentation,
  property: PropertyAssignment,
  props: JayveeValidationProps,
) {
  if (
    propName === 'filePath' &&
    internalValueToString(propValue).includes('..')
  ) {
    props.validationContext.accept(
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
  props: JayveeValidationProps,
) {
  if (propName === 'delete') {
    const cellRanges = evaluatePropertyValue(
      property,
      props.evaluationContext,
      props.wrapperFactory,
      new CollectionValuetype(PrimitiveValuetypes.CellRange),
    );

    cellRanges?.forEach((cellRange) => {
      if (!isRowWrapper(cellRange)) {
        props.validationContext.accept(
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
  props: JayveeValidationProps,
) {
  if (propName === 'columns') {
    const valuetypeAssignments = evaluatePropertyValue(
      property,
      props.evaluationContext,
      props.wrapperFactory,
      new CollectionValuetype(PrimitiveValuetypes.ValuetypeAssignment),
    );
    if (valuetypeAssignments === undefined) {
      return;
    }

    checkUniqueNames(valuetypeAssignments, props.validationContext, 'column');
  }
}

function checkTextFileInterpreterProperty(
  propName: string,
  propValue: InternalValueRepresentation,
  property: PropertyAssignment,
  props: JayveeValidationProps,
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
      props,
    );
  }
}

function checkTextLineDeleterProperty(
  propName: string,
  property: PropertyAssignment,
  props: JayveeValidationProps,
) {
  if (propName === 'lines') {
    const minTextLineIndex = 1;
    const lines = evaluatePropertyValue(
      property,
      props.evaluationContext,
      props.wrapperFactory,
      new CollectionValuetype(PrimitiveValuetypes.Integer),
    );
    lines?.forEach((value, index) => {
      if (value < minTextLineIndex) {
        props.validationContext.accept(
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
  props: JayveeValidationProps,
) {
  const minLineIndex = 1;
  if (propName === 'lineFrom' || propName === 'lineTo') {
    if (typeof propValue === 'number' && propValue < minLineIndex) {
      props.validationContext.accept(
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
  props: JayveeValidationProps,
) {
  if (!allowedValues.includes(propValue)) {
    props.validationContext.accept(
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
