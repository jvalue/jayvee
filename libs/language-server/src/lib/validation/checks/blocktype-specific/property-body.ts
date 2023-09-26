// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  CollectionValuetype,
  EvaluationContext,
  PrimitiveValuetypes,
  PropertyBody,
  evaluatePropertyValue,
} from '../../../ast';
import { ValidationContext } from '../../validation-context';

export function checkBlocktypeSpecificPropertyBody(
  propertyBody: PropertyBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  switch (propertyBody.$container.type.ref?.name) {
    case 'TextRangeSelector':
      return checkTextRangeSelectorPropertyBody(
        propertyBody,
        validationContext,
        evaluationContext,
      );
    case 'CellWriter':
      return checkCellWriterPropertyBody(
        propertyBody,
        validationContext,
        evaluationContext,
      );
    case 'TableTransformer':
      return checkTableTransformerPropertyBody(
        propertyBody,
        validationContext,
        evaluationContext,
      );
    default:
  }
}

function checkTextRangeSelectorPropertyBody(
  propertyBody: PropertyBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  const lineFromProperty = propertyBody.properties.find(
    (p) => p.name === 'lineFrom',
  );
  const lineToProperty = propertyBody.properties.find(
    (p) => p.name === 'lineTo',
  );

  if (lineFromProperty === undefined || lineToProperty === undefined) {
    return;
  }

  const lineFrom = evaluatePropertyValue(
    lineFromProperty,
    evaluationContext,
    PrimitiveValuetypes.Integer,
  );
  const lineTo = evaluatePropertyValue(
    lineToProperty,
    evaluationContext,
    PrimitiveValuetypes.Integer,
  );
  if (lineFrom === undefined || lineTo === undefined) {
    return;
  }

  if (lineFrom > lineTo) {
    [lineFromProperty, lineToProperty].forEach((property) => {
      validationContext.accept(
        'error',
        'The lower line number needs to be smaller or equal to the upper line number',
        { node: property.value },
      );
    });
  }
}

function checkCellWriterPropertyBody(
  propertyBody: PropertyBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  const writeProperty = propertyBody.properties.find((p) => p.name === 'write');
  const atProperty = propertyBody.properties.find((p) => p.name === 'at');

  if (writeProperty === undefined || atProperty === undefined) {
    return;
  }

  const writeValues = evaluatePropertyValue(
    writeProperty,
    evaluationContext,
    new CollectionValuetype(PrimitiveValuetypes.Text),
  );

  const atValue = evaluatePropertyValue(
    atProperty,
    evaluationContext,
    PrimitiveValuetypes.CellRange,
  );

  if (writeValues === undefined || atValue === undefined) {
    return;
  }

  const numberOfValuesToWrite = writeValues.length;
  const numberOfCells = atValue.numberOfCells();

  if (numberOfCells !== numberOfValuesToWrite) {
    [writeProperty, atProperty].forEach((propertyNode) => {
      validationContext.accept(
        'warning',
        `The number of values to write (${numberOfValuesToWrite}) does not match the number of cells (${numberOfCells})`,
        { node: propertyNode.value },
      );
    });
  }
}

function checkTableTransformerPropertyBody(
  propertyBody: PropertyBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  checkInputColumnsMatchTransformationPorts(
    propertyBody,
    validationContext,
    evaluationContext,
  );
}

function checkInputColumnsMatchTransformationPorts(
  propertyBody: PropertyBody,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  const useProperty = propertyBody.properties.find((x) => x.name === 'use');
  const inputColumnsProperty = propertyBody.properties.find(
    (x) => x.name === 'inputColumns',
  );

  if (useProperty === undefined || inputColumnsProperty === undefined) {
    return;
  }

  const transform = evaluatePropertyValue(
    useProperty,
    evaluationContext,
    PrimitiveValuetypes.Transform,
  );
  const inputColumns = evaluatePropertyValue(
    inputColumnsProperty,
    evaluationContext,
    new CollectionValuetype(PrimitiveValuetypes.Text),
  );

  if (transform === undefined || inputColumns === undefined) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const transformInputPorts = transform?.body?.ports?.filter(
    (x) => x.kind === 'from',
  );
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (transformInputPorts === undefined) {
    return;
  }

  const numberTransformPorts = transformInputPorts.length;
  const numberInputColumns = inputColumns.length;

  if (numberTransformPorts !== numberInputColumns) {
    validationContext.accept(
      'error',
      `Expected ${numberTransformPorts} columns but only got ${numberInputColumns}`,
      {
        node: inputColumnsProperty,
      },
    );
  }
}
