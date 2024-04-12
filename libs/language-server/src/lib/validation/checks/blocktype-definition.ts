// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockTypeProperty,
  ReferenceableBlockTypeDefinition,
  createValueType,
  evaluateExpression,
} from '../../ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validateBlockTypeDefinition(
  blocktype: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  checkNoMultipleInputs(blocktype, props);
  checkNoMultipleOutputs(blocktype, props);
  checkOneInput(blocktype, props);
  checkOneOutput(blocktype, props);
  checkNoDuplicateProperties(blocktype, props);
  checkPropertiesDefaultValuesHaveCorrectType(blocktype, props);
}

function checkNoMultipleInputs(
  blocktype: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktype.inputs === undefined) {
    return;
  }

  if (blocktype.inputs.length > 1) {
    blocktype.inputs.forEach((inputDefinition) => {
      props.validationContext.accept(
        'error',
        `Found more than one input definition in block type '${blocktype.name}'`,
        {
          node: inputDefinition,
        },
      );
    });
  }
}

function checkNoMultipleOutputs(
  blocktype: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktype.outputs === undefined) {
    return;
  }

  if (blocktype.outputs.length > 1) {
    blocktype.outputs.forEach((outputDefinition) => {
      props.validationContext.accept(
        'error',
        `Found more than one output definition in block type '${blocktype.name}'`,
        {
          node: outputDefinition,
        },
      );
    });
  }
}

function checkOneInput(
  blocktype: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const numberOfInputs = blocktype.inputs?.length ?? 0;

  if (numberOfInputs < 1) {
    props.validationContext.accept(
      'error',
      `Found no input in block type '${blocktype.name}' - consider using iotype "none" if the block type consumes no input`,
      {
        node: blocktype,
      },
    );
  }
}

function checkOneOutput(
  blocktype: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const numberOfOutputs = blocktype.outputs?.length ?? 0;

  if (numberOfOutputs < 1) {
    props.validationContext.accept(
      'error',
      `Found no output in block type '${blocktype.name}' - consider using iotype "none" if the block type produces no output`,
      {
        node: blocktype,
      },
    );
  }
}

function checkNoDuplicateProperties(
  blocktype: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktype.properties === undefined) {
    return;
  }

  const propertyMap = new Map<string, BlockTypeProperty[]>();
  for (const property of blocktype.properties) {
    const propertyName = property.name;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (propertyName === undefined) {
      continue;
    }
    const trackedPropertiesWithName = propertyMap.get(propertyName) ?? [];
    propertyMap.set(propertyName, [...trackedPropertiesWithName, property]);
  }

  [...propertyMap.values()]
    .filter((properties) => properties.length > 1)
    .forEach((properties) => {
      properties.forEach((property) => {
        props.validationContext.accept(
          'error',
          `Property '${property.name}' in block type '${blocktype.name}' is defined multiple times`,
          {
            node: property,
            property: 'name',
          },
        );
      });
    });
}

function checkPropertiesDefaultValuesHaveCorrectType(
  blocktype: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktype.properties === undefined) {
    return;
  }

  blocktype.properties
    .filter((property) => property.defaultValue !== undefined)
    .forEach((property) =>
      checkPropertyDefaultValuesHasCorrectType(property, props),
    );
}

function checkPropertyDefaultValuesHasCorrectType(
  property: BlockTypeProperty,
  props: JayveeValidationProps,
): void {
  const defaultValueExpression = property.defaultValue;
  if (defaultValueExpression === undefined) {
    return;
  }

  const evaluatedExpression = evaluateExpression(
    defaultValueExpression,
    props.evaluationContext,
    props.wrapperFactories,
    props.validationContext,
  );
  if (evaluatedExpression === undefined) {
    props.validationContext.accept(
      'error',
      `Could not evaluate this expression.`,
      {
        node: property,
        property: 'defaultValue',
      },
    );
    return;
  }

  const expectedValuetype = createValueType(property.valueType);
  assert(expectedValuetype !== undefined);

  if (!expectedValuetype.isInternalValueRepresentation(evaluatedExpression)) {
    props.validationContext.accept(
      'error',
      `This default value is not compatible with value type ${expectedValuetype.getName()}`,
      {
        node: property,
        property: 'defaultValue',
      },
    );
  }
}
