// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type PropertyBody, evaluatePropertyValue } from '../../../ast';
import { type JayveeValidationProps } from '../../validation-registry';

export function checkBlockTypeSpecificPropertyBody(
  propertyBody: PropertyBody,
  props: JayveeValidationProps,
) {
  switch (propertyBody.$container.type.ref?.name) {
    case 'TextRangeSelector':
      return checkTextRangeSelectorPropertyBody(propertyBody, props);
    case 'CellWriter':
      return checkCellWriterPropertyBody(propertyBody, props);
    case 'TableTransformer':
      return checkTableTransformerPropertyBody(propertyBody, props);
    default:
  }
}

function checkTextRangeSelectorPropertyBody(
  propertyBody: PropertyBody,
  props: JayveeValidationProps,
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
    props.evaluationContext,
    props.wrapperFactories,
    props.valueTypeProvider.Primitives.Integer,
  );
  const lineTo = evaluatePropertyValue(
    lineToProperty,
    props.evaluationContext,
    props.wrapperFactories,
    props.valueTypeProvider.Primitives.Integer,
  );
  if (lineFrom === undefined || lineTo === undefined) {
    return;
  }

  if (lineFrom > lineTo) {
    [lineFromProperty, lineToProperty].forEach((property) => {
      props.validationContext.accept(
        'error',
        'The lower line number needs to be smaller or equal to the upper line number',
        { node: property.value },
      );
    });
  }
}

function checkCellWriterPropertyBody(
  propertyBody: PropertyBody,
  props: JayveeValidationProps,
) {
  const writeProperty = propertyBody.properties.find((p) => p.name === 'write');
  const atProperty = propertyBody.properties.find((p) => p.name === 'at');

  if (writeProperty === undefined || atProperty === undefined) {
    return;
  }

  const writeValues = evaluatePropertyValue(
    writeProperty,
    props.evaluationContext,
    props.wrapperFactories,
    props.valueTypeProvider.createCollectionValueTypeOf(
      props.valueTypeProvider.Primitives.Text,
    ),
  );

  const atValue = evaluatePropertyValue(
    atProperty,
    props.evaluationContext,
    props.wrapperFactories,
    props.valueTypeProvider.Primitives.CellRange,
  );

  if (writeValues === undefined || atValue === undefined) {
    return;
  }

  if (!props.wrapperFactories.CellRange.canWrap(atValue)) {
    return;
  }
  const atValueWrapper = props.wrapperFactories.CellRange.wrap(atValue);

  const numberOfValuesToWrite = writeValues.length;
  const numberOfCells = atValueWrapper.numberOfCells();

  if (numberOfCells !== numberOfValuesToWrite) {
    [writeProperty, atProperty].forEach((propertyNode) => {
      props.validationContext.accept(
        'warning',
        `The number of values to write (${numberOfValuesToWrite}) does not match the number of cells (${numberOfCells})`,
        { node: propertyNode.value },
      );
    });
  }
}

function checkTableTransformerPropertyBody(
  propertyBody: PropertyBody,
  props: JayveeValidationProps,
) {
  checkInputColumnsMatchTransformationPorts(propertyBody, props);
}

function checkInputColumnsMatchTransformationPorts(
  propertyBody: PropertyBody,
  props: JayveeValidationProps,
): void {
  const useProperty = propertyBody.properties.find((x) => x.name === 'uses');
  const inputColumnsProperty = propertyBody.properties.find(
    (x) => x.name === 'inputColumns',
  );

  if (useProperty === undefined || inputColumnsProperty === undefined) {
    return;
  }

  const transform = evaluatePropertyValue(
    useProperty,
    props.evaluationContext,
    props.wrapperFactories,
    props.valueTypeProvider.Primitives.Transform,
  );
  const inputColumns = evaluatePropertyValue(
    inputColumnsProperty,
    props.evaluationContext,
    props.wrapperFactories,
    props.valueTypeProvider.createCollectionValueTypeOf(
      props.valueTypeProvider.Primitives.Text,
    ),
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
    props.validationContext.accept(
      'error',
      `Expected ${numberTransformPorts} columns but only got ${numberInputColumns}`,
      {
        node: inputColumnsProperty,
      },
    );
  }
}
