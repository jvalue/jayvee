// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { Reference, isReference } from 'langium';

// eslint-disable-next-line import/no-cycle
import { Valuetype, createValuetype } from '../ast';
import {
  EvaluationContext,
  evaluateExpression,
} from '../ast/expressions/evaluation';
import { BuiltinConstrainttypeDefinition } from '../ast/generated/ast';
import { RuntimeParameterProvider } from '../services';

import { ExampleDoc, MetaInformation, PropertySpecification } from './meta-inf';

interface ConstraintDocs {
  description?: string;
  examples?: ExampleDoc[];
}

export class ConstraintMetaInformation extends MetaInformation {
  docs: ConstraintDocs = {};
  readonly wrapped: BuiltinConstrainttypeDefinition;
  readonly on: Valuetype;

  constructor(
    toBeWrapped:
      | BuiltinConstrainttypeDefinition
      | Reference<BuiltinConstrainttypeDefinition>,
  ) {
    const constraintTypeDefinition = isReference(toBeWrapped)
      ? toBeWrapped.ref
      : toBeWrapped;
    assert(constraintTypeDefinition !== undefined);

    const constraintTypeName = constraintTypeDefinition.name;

    const properties: Record<string, PropertySpecification> = {};
    for (const property of constraintTypeDefinition.properties) {
      const valuetype = createValuetype(property.valueType);
      assert(valuetype !== undefined);

      properties[property.name] = {
        type: valuetype,
      };

      const defaultValue = evaluateExpression(
        property.defaultValue,
        new EvaluationContext(new RuntimeParameterProvider()),
      );
      if (defaultValue !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        properties[property.name]!.defaultValue = defaultValue;
      }
    }

    super(constraintTypeName, properties, undefined);

    this.wrapped = constraintTypeDefinition;

    const valuetype = createValuetype(constraintTypeDefinition.valuetype);
    assert(valuetype !== undefined);
    this.on = valuetype;
  }

  static canBeWrapped(
    toBeWrapped:
      | BuiltinConstrainttypeDefinition
      | Reference<BuiltinConstrainttypeDefinition>,
  ): boolean {
    const constraintTypeDefinition = isReference(toBeWrapped)
      ? toBeWrapped.ref
      : toBeWrapped;

    if (constraintTypeDefinition === undefined) {
      return false;
    }

    if (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      constraintTypeDefinition.properties === undefined ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      constraintTypeDefinition.name === undefined ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      constraintTypeDefinition.valuetype === undefined
    ) {
      return false;
    }

    if (
      constraintTypeDefinition.properties.some((property) => {
        return property.valueType.reference.ref === undefined;
      })
    ) {
      return false;
    }

    return true;
  }
}
