// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type Reference, isReference } from 'langium';

import { RuntimeParameterProvider } from '../../../services';
import {
  EvaluationContext,
  type OperatorEvaluatorRegistry,
  evaluateExpression,
} from '../../expressions';
import { type ReferenceableBlockTypeDefinition } from '../../generated/ast';
import { IOType, getIOType } from '../../io-type';
import { type ValueTypeProvider } from '../value-type';
import { type WrapperFactoryProvider } from '../wrapper-factory-provider';

import {
  type ExampleDoc,
  type PropertySpecification,
  TypedObjectWrapper,
} from './typed-object-wrapper';

interface BlockDocs {
  description?: string;
  examples?: ExampleDoc[];
}

export class BlockTypeWrapper extends TypedObjectWrapper<ReferenceableBlockTypeDefinition> {
  docs: BlockDocs = {};

  readonly inputType: IOType;
  readonly outputType: IOType;

  /**
   * Creates a BlockTypeWrapper if possible. Otherwise, throws error.
   * Use @see canBeWrapped to check whether wrapping will be successful.
   *
   * Use @see WrapperFactoryProvider for instantiation instead of calling this constructor directly.
   */
  constructor(
    toBeWrapped:
      | ReferenceableBlockTypeDefinition
      | Reference<ReferenceableBlockTypeDefinition>,
    operatorEvaluatorRegistry: OperatorEvaluatorRegistry,
    valueTypeProvider: ValueTypeProvider,
    wrapperFactories: WrapperFactoryProvider,
  ) {
    const blockTypeDefinition = isReference(toBeWrapped)
      ? toBeWrapped.ref
      : toBeWrapped;
    assert(blockTypeDefinition !== undefined);

    const blockTypeName = blockTypeDefinition.name;

    const properties: Record<string, PropertySpecification> = {};
    for (const property of blockTypeDefinition.properties) {
      const valueType = wrapperFactories.ValueType.wrap(property.valueType);
      assert(valueType !== undefined);

      properties[property.name] = {
        type: valueType,
      };

      const defaultValue = evaluateExpression(
        property.defaultValue,
        new EvaluationContext(
          new RuntimeParameterProvider(),
          operatorEvaluatorRegistry,
          valueTypeProvider,
        ),
        wrapperFactories,
      );
      if (defaultValue !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        properties[property.name]!.defaultValue = defaultValue;
      }
    }

    super(blockTypeDefinition, blockTypeName, properties, undefined);

    const inputPort = blockTypeDefinition.inputs[0];
    assert(inputPort !== undefined);
    this.inputType = getIOType(inputPort);

    const outputPort = blockTypeDefinition.outputs[0];
    assert(outputPort !== undefined);
    this.outputType = getIOType(outputPort);
  }

  static canBeWrapped(
    toBeWrapped:
      | ReferenceableBlockTypeDefinition
      | Reference<ReferenceableBlockTypeDefinition>,
  ): boolean {
    const blockTypeDefinition = isReference(toBeWrapped)
      ? toBeWrapped.ref
      : toBeWrapped;

    if (blockTypeDefinition === undefined) {
      return false;
    }

    if (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      blockTypeDefinition.properties === undefined ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      blockTypeDefinition.name === undefined ||
      blockTypeDefinition.inputs[0] === undefined ||
      blockTypeDefinition.outputs[0] === undefined
    ) {
      return false;
    }

    if (
      blockTypeDefinition.properties.some((property) => {
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
