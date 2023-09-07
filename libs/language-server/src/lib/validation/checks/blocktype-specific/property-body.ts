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
