// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import { RuntimeParameterProvider } from '../../services';
import {} from '../../validation/validation-context';
import {
  FreeVariableLiteral,
  ReferenceLiteral,
  ValueKeywordLiteral,
  isBlocktypeProperty,
  isConstraintDefinition,
  isReferenceLiteral,
  isTransformDefinition,
  isTransformPortDefinition,
  isValueKeywordLiteral,
} from '../generated/ast';
// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetypes } from '../wrappers/value-type/primitive/primitive-valuetypes';
import { type Valuetype } from '../wrappers/value-type/valuetype';

import { type InternalValueRepresentation } from './internal-value-representation';
import { type ExpressionEvaluatorRegistry } from './operator-registry';

export class EvaluationContext {
  private readonly variableValues = new Map<
    string,
    InternalValueRepresentation
  >();
  private valueKeywordValue: InternalValueRepresentation | undefined =
    undefined;

  constructor(
    public readonly runtimeParameterProvider: RuntimeParameterProvider,
    public readonly operatorRegistry: ExpressionEvaluatorRegistry,
  ) {}

  getValueFor(
    literal: FreeVariableLiteral,
  ): InternalValueRepresentation | undefined {
    if (isReferenceLiteral(literal)) {
      return this.getValueForReference(literal);
    } else if (isValueKeywordLiteral(literal)) {
      return this.getValueForValueKeyword(literal);
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
    if (isBlocktypeProperty(dereferenced)) {
      return this.variableValues.get(dereferenced.name);
    }
    assertUnreachable(dereferenced);
  }

  hasValueForRuntimeParameter(key: string): boolean {
    return this.runtimeParameterProvider.hasValue(key);
  }

  getValueForRuntimeParameter<I extends InternalValueRepresentation>(
    key: string,
    valuetype: Valuetype<I>,
  ): I | undefined {
    return this.runtimeParameterProvider.getParsedValue(key, valuetype);
  }

  setValueForValueKeyword(value: InternalValueRepresentation) {
    this.valueKeywordValue = value;
  }

  deleteValueForValueKeyword() {
    this.valueKeywordValue = undefined;
  }

  getValueForValueKeyword(
    literal: ValueKeywordLiteral,
  ): InternalValueRepresentation | undefined {
    if (this.valueKeywordValue === undefined) {
      return undefined;
    }

    if (literal.lengthAccess) {
      assert(
        PrimitiveValuetypes.Text.isInternalValueRepresentation(
          this.valueKeywordValue,
        ),
      );
      return this.valueKeywordValue.length;
    }

    return this.valueKeywordValue;
  }
}
