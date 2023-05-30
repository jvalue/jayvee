// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../ast/expressions/evaluation';
import { type Valuetype } from '../ast/wrappers/value-type/valuetype';

export class RuntimeParameterProvider {
  private runtimeParameters = new Map<string, string>();
  public runtimeParameterValueParser: <I extends InternalValueRepresentation>(
    value: string,
    valuetype: Valuetype<I>,
  ) => I | undefined = () => undefined;

  getParsedValue<I extends InternalValueRepresentation>(
    key: string,
    valuetype: Valuetype<I>,
  ): I | undefined {
    const stringValue = this.runtimeParameters.get(key);
    if (stringValue === undefined) {
      return undefined;
    }
    return this.runtimeParameterValueParser(stringValue, valuetype);
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
