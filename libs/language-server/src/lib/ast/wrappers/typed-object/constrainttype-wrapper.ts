// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { Reference, isReference } from 'langium';

import { RuntimeParameterProvider } from '../../../services';
// eslint-disable-next-line import/no-cycle
import { evaluateExpression } from '../../expressions/evaluate-expression';
import { EvaluationContext } from '../../expressions/evaluation-context';
import { type OperatorEvaluatorRegistry } from '../../expressions/operator-registry';
import { BuiltinConstrainttypeDefinition } from '../../generated/ast';
import { ValueType, createValueType } from '../value-type';
import { type WrapperFactoryProvider } from '../wrapper-factory-provider';

import {
  ExampleDoc,
  PropertySpecification,
  TypedObjectWrapper,
} from './typed-object-wrapper';

interface ConstraintDocs {
  description?: string;
  examples?: ExampleDoc[];
}

export class ConstraintTypeWrapper extends TypedObjectWrapper<BuiltinConstrainttypeDefinition> {
  docs: ConstraintDocs = {};
  readonly on: ValueType;

  /**
   * Creates a ConstraintTypeWrapper if possible. Otherwise, throws error.
   * Use @see canBeWrapped to check whether wrapping will be successful.
   *
   * Use @see WrapperFactoryProvider for instantiation instead of calling this constructor directly.
   */
  constructor(
    toBeWrapped:
      | BuiltinConstrainttypeDefinition
      | Reference<BuiltinConstrainttypeDefinition>,
    operatorEvaluatorRegistry: OperatorEvaluatorRegistry,
    wrapperFactories: WrapperFactoryProvider,
  ) {
    const constraintTypeDefinition = isReference(toBeWrapped)
      ? toBeWrapped.ref
      : toBeWrapped;
    assert(constraintTypeDefinition !== undefined);

    const constraintTypeName = constraintTypeDefinition.name;

    const properties: Record<string, PropertySpecification> = {};
    for (const property of constraintTypeDefinition.properties) {
      const valueType = createValueType(property.valueType);
      assert(valueType !== undefined);

      properties[property.name] = {
        type: valueType,
      };

      const defaultValue = evaluateExpression(
        property.defaultValue,
        new EvaluationContext(
          new RuntimeParameterProvider(),
          operatorEvaluatorRegistry,
        ),
        wrapperFactories,
      );
      if (defaultValue !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        properties[property.name]!.defaultValue = defaultValue;
      }
    }

    super(constraintTypeDefinition, constraintTypeName, properties, undefined);

    const valueType = createValueType(constraintTypeDefinition.valueType);
    assert(valueType !== undefined);
    this.on = valueType;
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
      constraintTypeDefinition.valueType === undefined
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
