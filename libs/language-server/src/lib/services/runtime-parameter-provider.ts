// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import {
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  MissingValue,
} from '../ast/expressions/internal-value-representation';
import { type ValueType } from '../ast/wrappers/value-type/value-type';

export type InternalValidValueRepresentationParser = <
  I extends InternalValidValueRepresentation,
>(
  value: string,
  valueType: ValueType<I>,
) => I | InternalErrorValueRepresentation;

export class RuntimeParameterProvider {
  private runtimeParameters = new Map<string, string>();
  private valueParser: InternalValidValueRepresentationParser | undefined =
    undefined;

  setValueParser(valueParser: InternalValidValueRepresentationParser) {
    this.valueParser = valueParser;
  }

  getParsedValue<I extends InternalValidValueRepresentation>(
    key: string,
    valueType: ValueType<I>,
  ): I | InternalErrorValueRepresentation {
    const stringValue = this.getRawValue(key);
    if (stringValue === undefined) {
      return new MissingValue(
        `Could not find value for runtime parameter ${key}`,
      );
    }

    assert(this.valueParser !== undefined);
    return this.valueParser(stringValue, valueType);
  }

  getRawValue(key: string): string | undefined {
    return this.runtimeParameters.get(key);
  }

  setValue(key: string, value: string) {
    this.runtimeParameters.set(key, value);
  }

  hasValue(key: string): boolean {
    return this.runtimeParameters.has(key);
  }

  getReadonlyMap(): ReadonlyMap<string, InternalValidValueRepresentation> {
    return this.runtimeParameters;
  }
}
