// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import { type RuntimeParameterProvider } from '../../services';
import {} from '../../validation/validation-context';
import {
  type FreeVariableLiteral,
  type ReferenceLiteral,
  type ValueKeywordLiteral,
  isBlockTypeProperty,
  isConstraintDefinition,
  isReferenceLiteral,
  isTransformDefinition,
  isTransformPortDefinition,
  isValueKeywordLiteral,
} from '../generated/ast';
import { type ValueTypeProvider } from '../wrappers';
import { type ValueType } from '../wrappers/value-type/value-type';

import { type InternalValueRepresentation } from './internal-value-representation';
import { type OperatorEvaluatorRegistry } from './operator-registry';

export class EvaluationContext {
  private readonly variableValues = new Map<
    string,
    InternalValueRepresentation
  >();
  private valueKeywordValue: InternalValueRepresentation | undefined =
    undefined;

  constructor(
    public readonly runtimeParameterProvider: RuntimeParameterProvider,
    public readonly operatorRegistry: OperatorEvaluatorRegistry,
    public readonly valueTypeProvider: ValueTypeProvider,
  ) {}

  getValueFor(
    literal: FreeVariableLiteral,
  ): InternalValueRepresentation | undefined {
    if (isReferenceLiteral(literal)) {
      return this.getValueForReference(literal);
    } else if (isValueKeywordLiteral(literal)) {
      return this.getValueForValueKeyword(literal, this.valueTypeProvider);
    }
    assertUnreachable(literal);
  }

  setValueForReference(
    refText: string,
    value: InternalValueRepresentation,
  ): void {
    this.variableValues.set(refText, value);
  }

  deleteValueForReference(refText: string): void {
    this.variableValues.delete(refText);
  }

  getValueForReference(
    referenceLiteral: ReferenceLiteral,
  ): InternalValueRepresentation | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const dereferenced = referenceLiteral?.value?.ref;
    if (dereferenced === undefined) {
      return undefined;
    }

    if (isConstraintDefinition(dereferenced)) {
      return dereferenced;
    }
    if (isTransformDefinition(dereferenced)) {
      return dereferenced;
    }
    if (isTransformPortDefinition(dereferenced)) {
      return this.variableValues.get(dereferenced.name);
    }
    if (isBlockTypeProperty(dereferenced)) {
      return this.variableValues.get(dereferenced.name);
    }
    assertUnreachable(dereferenced);
  }

  hasValueForRuntimeParameter(key: string): boolean {
    return this.runtimeParameterProvider.hasValue(key);
  }

  getValueForRuntimeParameter<I extends InternalValueRepresentation>(
    key: string,
    valueType: ValueType<I>,
  ): I | undefined {
    return this.runtimeParameterProvider.getParsedValue(key, valueType);
  }

  setValueForValueKeyword(value: InternalValueRepresentation) {
    this.valueKeywordValue = value;
  }

  deleteValueForValueKeyword() {
    this.valueKeywordValue = undefined;
  }

  getValueForValueKeyword(
    literal: ValueKeywordLiteral,
    valueTypeProvider: ValueTypeProvider,
  ): InternalValueRepresentation | undefined {
    if (this.valueKeywordValue === undefined) {
      return undefined;
    }

    if (literal.lengthAccess) {
      assert(
        valueTypeProvider.Primitives.Text.isInternalValueRepresentation(
          this.valueKeywordValue,
        ),
      );
      return this.valueKeywordValue.length;
    }

    return this.valueKeywordValue;
  }
}
