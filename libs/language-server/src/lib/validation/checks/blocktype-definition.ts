// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/working-with-the-ast for why the following ESLint rule is disabled for this file.
 */

import { strict as assert } from 'assert';

import {
  BlocktypeProperty,
  BuiltinBlocktypeDefinition,
  EvaluationContext,
  createValuetype,
  evaluateExpression,
} from '../../ast';
import { ValidationContext } from '../validation-context';

export function validateBlocktypeDefinition(
  blocktype: BuiltinBlocktypeDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  checkNoMultipleInputs(blocktype, validationContext);
  checkNoMultipleOutputs(blocktype, validationContext);
  checkAtleastOneInputOrOutput(blocktype, validationContext);
  checkNoDuplicateProperties(blocktype, validationContext);
  checkPropertiesDefaultValuesHaveCorrectType(
    blocktype,
    validationContext,
    evaluationContext,
  );
}

function checkNoMultipleInputs(
  blocktype: BuiltinBlocktypeDefinition,
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
  blocktype: BuiltinBlocktypeDefinition,
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

function checkAtleastOneInputOrOutput(
  blocktype: BuiltinBlocktypeDefinition,
  context: ValidationContext,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const numberOfInputs = blocktype.inputs?.length ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const numberOfOutputs = blocktype.outputs?.length ?? 0;

  if (numberOfInputs + numberOfOutputs < 1) {
    context.accept(
      'error',
      `Found neither input nor output definitions in blocktype '${blocktype.name}'`,
      {
        node: blocktype,
      },
    );
  }
}

function checkNoDuplicateProperties(
  blocktype: BuiltinBlocktypeDefinition,
  context: ValidationContext,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (blocktype.properties === undefined) {
    return;
  }

  const propertyMap: Map<string, BlocktypeProperty[]> = new Map();
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
  blocktype: BuiltinBlocktypeDefinition,
  context: ValidationContext,
  evaluationContext: EvaluationContext,
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
        context,
        evaluationContext,
      ),
    );
}

function checkPropertyDefaultValuesHasCorrectType(
  property: BlocktypeProperty,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  const defaultValueExpression = property.defaultValue;
  if (defaultValueExpression === undefined) {
    return;
  }

  const evaluatedExpression = evaluateExpression(
    defaultValueExpression,
    evaluationContext,
    validationContext,
  );
  if (evaluatedExpression === undefined) {
    validationContext.accept('error', `Could not evaluate this expression.`, {
      node: property,
      property: 'defaultValue',
    });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const expectedValuetype = createValuetype(property.valuetype?.ref);
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
