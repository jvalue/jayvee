// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlocktypeProperty,
  EvaluationContext,
  ReferenceableBlocktypeDefinition,
  WrapperFactory,
  createValuetype,
  evaluateExpression,
} from '../../ast';
import { ValidationContext } from '../validation-context';

export function validateBlocktypeDefinition(
  blocktype: ReferenceableBlocktypeDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
): void {
  checkNoMultipleInputs(blocktype, validationContext);
  checkNoMultipleOutputs(blocktype, validationContext);
  checkOneInput(blocktype, validationContext);
  checkOneOutput(blocktype, validationContext);
  checkNoDuplicateProperties(blocktype, validationContext);
  checkPropertiesDefaultValuesHaveCorrectType(
    blocktype,
    validationContext,
    evaluationContext,
    wrapperFactory,
  );
}

function checkNoMultipleInputs(
  blocktype: ReferenceableBlocktypeDefinition,
  context: ValidationContext,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktype.inputs === undefined) {
    return;
  }

  if (blocktype.inputs.length > 1) {
    blocktype.inputs.forEach((inputDefinition) => {
      context.accept(
        'error',
        `Found more than one input definition in blocktype '${blocktype.name}'`,
        {
          node: inputDefinition,
        },
      );
    });
  }
}

function checkNoMultipleOutputs(
  blocktype: ReferenceableBlocktypeDefinition,
  context: ValidationContext,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktype.outputs === undefined) {
    return;
  }

  if (blocktype.outputs.length > 1) {
    blocktype.outputs.forEach((outputDefinition) => {
      context.accept(
        'error',
        `Found more than one output definition in blocktype '${blocktype.name}'`,
        {
          node: outputDefinition,
        },
      );
    });
  }
}

function checkOneInput(
  blocktype: ReferenceableBlocktypeDefinition,
  context: ValidationContext,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const numberOfInputs = blocktype.inputs?.length ?? 0;

  if (numberOfInputs < 1) {
    context.accept(
      'error',
      `Found no input in blocktype '${blocktype.name}' - consider using iotype "none" if the blocktype consumes no input`,
      {
        node: blocktype,
      },
    );
  }
}

function checkOneOutput(
  blocktype: ReferenceableBlocktypeDefinition,
  context: ValidationContext,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const numberOfOutputs = blocktype.outputs?.length ?? 0;

  if (numberOfOutputs < 1) {
    context.accept(
      'error',
      `Found no output in blocktype '${blocktype.name}' - consider using iotype "none" if the blocktype produces no output`,
      {
        node: blocktype,
      },
    );
  }
}

function checkNoDuplicateProperties(
  blocktype: ReferenceableBlocktypeDefinition,
  context: ValidationContext,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktype.properties === undefined) {
    return;
  }

  const propertyMap = new Map<string, BlocktypeProperty[]>();
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
        context.accept(
          'error',
          `Property '${property.name}' in blocktype '${blocktype.name}' is defined multiple times`,
          {
            node: property,
            property: 'name',
          },
        );
      });
    });
}

function checkPropertiesDefaultValuesHaveCorrectType(
  blocktype: ReferenceableBlocktypeDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktype.properties === undefined) {
    return;
  }

  blocktype.properties
    .filter((property) => property.defaultValue !== undefined)
    .forEach((property) =>
      checkPropertyDefaultValuesHasCorrectType(
        property,
        validationContext,
        evaluationContext,
        wrapperFactory,
      ),
    );
}

function checkPropertyDefaultValuesHasCorrectType(
  property: BlocktypeProperty,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
  wrapperFactory: WrapperFactory,
): void {
  const defaultValueExpression = property.defaultValue;
  if (defaultValueExpression === undefined) {
    return;
  }

  const evaluatedExpression = evaluateExpression(
    defaultValueExpression,
    evaluationContext,
    wrapperFactory,
    validationContext,
  );
  if (evaluatedExpression === undefined) {
    validationContext.accept('error', `Could not evaluate this expression.`, {
      node: property,
      property: 'defaultValue',
    });
    return;
  }

  const expectedValuetype = createValuetype(property.valueType);
  assert(expectedValuetype !== undefined);

  if (!expectedValuetype.isInternalValueRepresentation(evaluatedExpression)) {
    validationContext.accept(
      'error',
      `This default value is not compatible with valuetype ${expectedValuetype.getName()}`,
      {
        node: property,
        property: 'defaultValue',
      },
    );
  }
}
