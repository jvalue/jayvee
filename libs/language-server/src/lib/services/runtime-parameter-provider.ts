// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../ast/expressions/internal-value-representation';
import { type ValueType } from '../ast/wrappers/value-type/value-type';

export type InternalValueRepresentationParser = <
  I extends InternalValueRepresentation,
>(
  value: string,
  valueType: ValueType<I>,
) => I | undefined;

export class RuntimeParameterProvider {
  private runtimeParameters = new Map<string, string>();
  private valueParser: InternalValueRepresentationParser | undefined =
    undefined;

  setValueParser(valueParser: InternalValueRepresentationParser) {
    this.valueParser = valueParser;
  }

  getParsedValue<I extends InternalValueRepresentation>(
    key: string,
    valueType: ValueType<I>,
  ): I | undefined {
    const stringValue = this.getRawValue(key);
    if (stringValue === undefined) {
      return undefined;
    }
    return this.valueParser?.(stringValue, valueType);
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

  getReadonlyMap(): ReadonlyMap<string, InternalValueRepresentation> {
    return this.runtimeParameters;
  }
}
