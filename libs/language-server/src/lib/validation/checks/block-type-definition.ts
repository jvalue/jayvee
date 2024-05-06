// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type BlockTypeProperty,
  type ReferenceableBlockTypeDefinition,
  evaluateExpression,
} from '../../ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validateBlockTypeDefinition(
  blockType: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  checkNoMultipleInputs(blockType, props);
  checkNoMultipleOutputs(blockType, props);
  checkOneInput(blockType, props);
  checkOneOutput(blockType, props);
  checkNoDuplicateProperties(blockType, props);
  checkPropertiesDefaultValuesHaveCorrectType(blockType, props);
}

function checkNoMultipleInputs(
  blockType: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blockType.inputs === undefined) {
    return;
  }

  if (blockType.inputs.length > 1) {
    blockType.inputs.forEach((inputDefinition) => {
      props.validationContext.accept(
        'error',
        `Found more than one input definition in block type '${blockType.name}'`,
        {
          node: inputDefinition,
        },
      );
    });
  }
}

function checkNoMultipleOutputs(
  blockType: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blockType.outputs === undefined) {
    return;
  }

  if (blockType.outputs.length > 1) {
    blockType.outputs.forEach((outputDefinition) => {
      props.validationContext.accept(
        'error',
        `Found more than one output definition in block type '${blockType.name}'`,
        {
          node: outputDefinition,
        },
      );
    });
  }
}

function checkOneInput(
  blockType: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const numberOfInputs = blockType.inputs?.length ?? 0;

  if (numberOfInputs < 1) {
    props.validationContext.accept(
      'error',
      `Found no input in block type '${blockType.name}' - consider using iotype "none" if the block type consumes no input`,
      {
        node: blockType,
      },
    );
  }
}

function checkOneOutput(
  blockType: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const numberOfOutputs = blockType.outputs?.length ?? 0;

  if (numberOfOutputs < 1) {
    props.validationContext.accept(
      'error',
      `Found no output in block type '${blockType.name}' - consider using iotype "none" if the block type produces no output`,
      {
        node: blockType,
      },
    );
  }
}

function checkNoDuplicateProperties(
  blockType: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blockType.properties === undefined) {
    return;
  }

  const propertyMap = new Map<string, BlockTypeProperty[]>();
  for (const property of blockType.properties) {
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
          `Property '${property.name}' in block type '${blockType.name}' is defined multiple times`,
          {
            node: property,
            property: 'name',
          },
        );
      });
    });
}

function checkPropertiesDefaultValuesHaveCorrectType(
  blockType: ReferenceableBlockTypeDefinition,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blockType.properties === undefined) {
    return;
  }

  blockType.properties
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

  const expectedValuetype = props.wrapperFactories.ValueType.wrap(
    property.valueType,
  );
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
