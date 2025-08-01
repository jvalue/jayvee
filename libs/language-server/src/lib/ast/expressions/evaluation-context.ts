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
  type ReferenceLiteral,
  isBlockTypeProperty,
  isConstraintDefinition,
  isReferenceLiteral,
  isTransformDefinition,
  isTransformPortDefinition,
  isValueKeywordLiteral,
  isValueTypeAttribute,
} from '../generated/ast';
import { type ValueTypeProvider } from '../wrappers';
import { type ValueType } from '../wrappers/value-type/value-type';

import {
  type InternalErrorRepresentation,
  type InternalValueRepresentation,
  MissingError,
} from './internal-value-representation';
import { type OperatorEvaluatorRegistry } from './operator-registry';

const NO_KEYWORD_ERROR: MissingError = new MissingError(
  'No value keyword literal',
);

export class EvaluationContext {
  private readonly variableValues = new Map<
    string,
    InternalValueRepresentation | InternalErrorRepresentation
  >();
  private valueKeywordValue:
    | InternalValueRepresentation
    | InternalErrorRepresentation = NO_KEYWORD_ERROR;

  constructor(
    public readonly runtimeParameterProvider: RuntimeParameterProvider,
    public readonly operatorRegistry: OperatorEvaluatorRegistry,
    public readonly valueTypeProvider: ValueTypeProvider,
  ) {}

  getValueFor(
    literal: FreeVariableLiteral,
  ): InternalValueRepresentation | InternalErrorRepresentation {
    if (isReferenceLiteral(literal)) {
      return this.getValueForReference(literal);
    } else if (isValueKeywordLiteral(literal)) {
      return this.getValueForValueKeyword();
    }
    assertUnreachable(literal);
  }

  setValueForReference(
    refText: string,
    value: InternalValueRepresentation | InternalErrorRepresentation,
  ): void {
    this.variableValues.set(refText, value);
  }

  deleteValueForReference(refText: string): void {
    this.variableValues.delete(refText);
  }

  getValueForReference(
    referenceLiteral: ReferenceLiteral,
  ): InternalValueRepresentation | InternalErrorRepresentation {
    const dereferenced = referenceLiteral.value.ref;
    if (dereferenced === undefined) {
      const error = referenceLiteral.value.error;
      assert(error !== undefined);
      return new MissingError(`Could not resolve reverence: ${error.message}`);
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
        new MissingError(`Could not find value for ${dereferenced.name}`)
      );
    }
    if (isBlockTypeProperty(dereferenced)) {
      return (
        this.variableValues.get(dereferenced.name) ??
        new MissingError(`Could not find value for ${dereferenced.name}`)
      );
    }
    if (isValueTypeAttribute(dereferenced)) {
      return (
        this.variableValues.get(dereferenced.name) ??
        new MissingError(`Could not find value for ${dereferenced.name}`)
      );
    }
    assertUnreachable(dereferenced);
  }

  hasValueForRuntimeParameter(key: string): boolean {
    return this.runtimeParameterProvider.hasValue(key);
  }

  getValueForRuntimeParameter<I extends InternalValueRepresentation>(
    key: string,
    valueType: ValueType<I>,
  ): I | InternalErrorRepresentation {
    return this.runtimeParameterProvider.getParsedValue(key, valueType);
  }

  setValueForValueKeyword(
    value: InternalValueRepresentation | InternalErrorRepresentation,
  ) {
    this.valueKeywordValue = value;
  }

  deleteValueForValueKeyword() {
    this.valueKeywordValue = NO_KEYWORD_ERROR;
  }

  getValueForValueKeyword():
    | InternalValueRepresentation
    | InternalErrorRepresentation {
    return this.valueKeywordValue;
  }
}
