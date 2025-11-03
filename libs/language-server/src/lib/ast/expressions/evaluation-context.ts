// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import { assertUnreachable } from 'langium';

import { type RuntimeParameterProvider } from '../../services';
import {} from '../../validation/validation-context';
import {
  type FreeVariableLiteral,
  type NestedPropertyAccess,
  type ReferenceLiteral,
  isBlockTypeProperty,
  isConstraintDefinition,
  isNestedPropertyAccess,
  isReferenceLiteral,
  isTransformDefinition,
  isTransformPortDefinition,
  isValueKeywordLiteral,
  isValueTypeProperty,
} from '../generated/ast';
import { type ValueTypeProvider } from '../wrappers';
import { type ValueType } from '../wrappers/value-type/value-type';

import {
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  MissingValue,
} from './internal-value-representation';
import { type OperatorEvaluatorRegistry } from './operator-registry';

const NO_KEYWORD_ERROR: MissingValue = new MissingValue(
  'No value keyword literal',
);

export class EvaluationContext {
  private readonly variableValues = new Map<
    string,
    InternalValidValueRepresentation | InternalErrorValueRepresentation
  >();
  private valueKeywordValue:
    | InternalValidValueRepresentation
    | InternalErrorValueRepresentation = NO_KEYWORD_ERROR;

  constructor(
    public readonly runtimeParameterProvider: RuntimeParameterProvider,
    public readonly operatorRegistry: OperatorEvaluatorRegistry,
    public readonly valueTypeProvider: ValueTypeProvider,
  ) {}

  getValueFor(
    literal: FreeVariableLiteral,
  ): InternalValidValueRepresentation | InternalErrorValueRepresentation {
    if (isReferenceLiteral(literal)) {
      return this.getValueForReference(literal);
    } else if (isValueKeywordLiteral(literal)) {
      return this.getValueForValueKeyword();
    } else if (isNestedPropertyAccess(literal)) {
      return this.getValueForNestedAccess(literal);
    }
    assertUnreachable(literal);
  }

  setValueForReference(
    refText: string,
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
  ): void {
    this.variableValues.set(refText, value);
  }

  deleteValueForReference(refText: string): void {
    this.variableValues.delete(refText);
  }

  getValueForNestedAccess(
    nestedAccess: NestedPropertyAccess,
  ): InternalValidValueRepresentation | InternalErrorValueRepresentation {
    const dereferenced = nestedAccess.value.ref;
    if (dereferenced === undefined) {
      const error = nestedAccess.value.error;
      assert(
        error !== undefined,
        'undefined references always set an error. See https://eclipse-langium.github.io/langium/interfaces/langium.Reference.html#error',
      );
      return new MissingValue(`Could not resolve reference: ${error.message}`);
    }
    assert(isValueTypeProperty(dereferenced));

    const value = this.variableValues.get(dereferenced.name);
    if (value === undefined) {
      return new MissingValue(
        `Could not find value for value type property ${dereferenced.name}`,
      );
    }
    // TODO: #683
    return value;
  }
  getValueForReference(
    referenceLiteral: ReferenceLiteral,
  ): InternalValidValueRepresentation | InternalErrorValueRepresentation {
    const dereferenced = referenceLiteral.value.ref;
    if (dereferenced === undefined) {
      const error = referenceLiteral.value.error;
      assert(error !== undefined);
      return new MissingValue(`Could not resolve reference: ${error.message}`);
    }

    if (isConstraintDefinition(dereferenced)) {
      return dereferenced;
    }
    if (isTransformDefinition(dereferenced)) {
      return dereferenced;
    }
    if (isTransformPortDefinition(dereferenced)) {
      return (
        this.variableValues.get(dereferenced.name) ??
        new MissingValue(
          `Could not find value for transform port ${dereferenced.name}`,
        )
      );
    }
    if (isBlockTypeProperty(dereferenced)) {
      return (
        this.variableValues.get(dereferenced.name) ??
        new MissingValue(
          `Could not find value for block type property ${dereferenced.name}`,
        )
      );
    }
    if (isValueTypeProperty(dereferenced)) {
      return (
        this.variableValues.get(dereferenced.name) ??
        new MissingValue(
          `Could not find value for value type property ${dereferenced.name}`,
        )
      );
    }
    assertUnreachable(dereferenced);
  }

  hasValueForRuntimeParameter(key: string): boolean {
    return this.runtimeParameterProvider.hasValue(key);
  }

  getValueForRuntimeParameter<I extends InternalValidValueRepresentation>(
    key: string,
    valueType: ValueType<I>,
  ): I | InternalErrorValueRepresentation {
    return this.runtimeParameterProvider.getParsedValue(key, valueType);
  }

  setValueForValueKeyword(
    value: InternalValidValueRepresentation | InternalErrorValueRepresentation,
  ) {
    this.valueKeywordValue = value;
  }

  deleteValueForValueKeyword() {
    this.valueKeywordValue = NO_KEYWORD_ERROR;
  }

  getValueForValueKeyword():
    | InternalValidValueRepresentation
    | InternalErrorValueRepresentation {
    return this.valueKeywordValue;
  }
}
