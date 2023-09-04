// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { Reference, isReference } from 'langium';

// eslint-disable-next-line import/no-cycle
import {
  EvaluationContext,
  IOType,
  createValuetype,
  evaluateExpression,
  getIOType,
} from '../ast';
import {
  ReferenceableBlocktypeDefinition,
  isBuiltinBlocktypeDefinition,
} from '../ast/generated/ast';
import { RuntimeParameterProvider } from '../services';

import { ExampleDoc, MetaInformation, PropertySpecification } from './meta-inf';

interface BlockDocs {
  description?: string;
  examples?: ExampleDoc[];
}

export class BlockMetaInformation extends MetaInformation {
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
        new EvaluationContext(new RuntimeParameterProvider()), // TODO: check if that works
      );
      if (defaultValue !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        properties[property.name]!.defaultValue = defaultValue;
      }
    }

    super(blocktypeName, properties, undefined);

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

    // TODO: implement
    if (isBuiltinBlocktypeDefinition(blocktypeDefinition)) {
      return true;
    }
    return true;
  }

  canBeConnectedTo(blockAfter: BlockMetaInformation): boolean {
    return this.outputType === blockAfter.inputType;
  }

  hasInput(): boolean {
    return this.inputType !== IOType.NONE;
  }

  hasOutput(): boolean {
    return this.outputType !== IOType.NONE;
  }
}
