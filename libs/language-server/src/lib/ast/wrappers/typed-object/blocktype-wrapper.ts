// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { Reference, isReference } from 'langium';

import { RuntimeParameterProvider } from '../../../services';
// eslint-disable-next-line import/no-cycle
import {
  DefaultExpressionEvaluatorRegistry,
  EvaluationContext,
  evaluateExpression,
} from '../../expressions';
import { ReferenceableBlocktypeDefinition } from '../../generated/ast';
import { IOType, getIOType } from '../../io-type';
import { createValuetype } from '../value-type';

import {
  ExampleDoc,
  PropertySpecification,
  TypedObjectWrapper,
} from './typed-object-wrapper';

interface BlockDocs {
  description?: string;
  examples?: ExampleDoc[];
}

export class BlockTypeWrapper extends TypedObjectWrapper<ReferenceableBlocktypeDefinition> {
  docs: BlockDocs = {};

  readonly inputType: IOType;
  readonly outputType: IOType;

  constructor(
    toBeWrapped:
      | ReferenceableBlocktypeDefinition
      | Reference<ReferenceableBlocktypeDefinition>,
  ) {
    const blocktypeDefinition = isReference(toBeWrapped)
      ? toBeWrapped.ref
      : toBeWrapped;
    assert(blocktypeDefinition !== undefined);

    const blocktypeName = blocktypeDefinition.name;

    const properties: Record<string, PropertySpecification> = {};
    for (const property of blocktypeDefinition.properties) {
      const valuetype = createValuetype(property.valueType);
      assert(valuetype !== undefined);

      properties[property.name] = {
        type: valuetype,
      };

      const defaultValue = evaluateExpression(
        property.defaultValue,
        new EvaluationContext(
          new RuntimeParameterProvider(),
          new DefaultExpressionEvaluatorRegistry(), // TODO: refactor wrappers as service and inject  services.ExpressionEvaluatorRegistry
        ),
      );
      if (defaultValue !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        properties[property.name]!.defaultValue = defaultValue;
      }
    }

    super(blocktypeDefinition, blocktypeName, properties, undefined);

    const inputPort = blocktypeDefinition.inputs[0];
    assert(inputPort !== undefined);
    this.inputType = getIOType(inputPort);

    const outputPort = blocktypeDefinition.outputs[0];
    assert(outputPort !== undefined);
    this.outputType = getIOType(outputPort);
  }

  static canBeWrapped(
    toBeWrapped:
      | ReferenceableBlocktypeDefinition
      | Reference<ReferenceableBlocktypeDefinition>,
  ): boolean {
    const blocktypeDefinition = isReference(toBeWrapped)
      ? toBeWrapped.ref
      : toBeWrapped;

    if (blocktypeDefinition === undefined) {
      return false;
    }

    if (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      blocktypeDefinition.properties === undefined ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      blocktypeDefinition.name === undefined ||
      blocktypeDefinition.inputs[0] === undefined ||
      blocktypeDefinition.outputs[0] === undefined
    ) {
      return false;
    }

    if (
      blocktypeDefinition.properties.some((property) => {
        return property.valueType.reference.ref === undefined;
      })
    ) {
      return false;
    }

    return true;
  }

  canBeConnectedTo(blockAfter: BlockTypeWrapper): boolean {
    return this.outputType === blockAfter.inputType;
  }

  hasInput(): boolean {
    return this.inputType !== IOType.NONE;
  }

  hasOutput(): boolean {
    return this.outputType !== IOType.NONE;
  }
}
