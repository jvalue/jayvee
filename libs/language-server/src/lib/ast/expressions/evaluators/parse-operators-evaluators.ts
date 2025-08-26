// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValueTypeProvider } from '../../wrappers';
import { type InvalidValue } from '../internal-value-representation';
import { DefaultUnaryOperatorEvaluator } from '../operator-evaluator';
import { STRING_TYPEGUARD } from '../typeguards';

export class AsTextOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  string,
  string
> {
  constructor(private readonly valueTypeProvider: ValueTypeProvider) {
    super('asText', STRING_TYPEGUARD);
  }
  override doEvaluate(operandValue: string): string {
    return this.valueTypeProvider.Primitives.Text.fromString(operandValue);
  }
}

export class AsDecimalOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  string,
  number
> {
  constructor(private readonly valueTypeProvider: ValueTypeProvider) {
    super('asDecimal', STRING_TYPEGUARD);
  }
  override doEvaluate(operandValue: string): number | InvalidValue {
    return this.valueTypeProvider.Primitives.Decimal.fromString(operandValue);
  }
}

export class AsIntegerOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  string,
  number
> {
  constructor(private readonly valueTypeProvider: ValueTypeProvider) {
    super('asInteger', STRING_TYPEGUARD);
  }
  override doEvaluate(operandValue: string): number | InvalidValue {
    return this.valueTypeProvider.Primitives.Integer.fromString(operandValue);
  }
}

export class AsBooleanOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  string,
  boolean
> {
  constructor(private readonly valueTypeProvider: ValueTypeProvider) {
    super('asBoolean', STRING_TYPEGUARD);
  }
  override doEvaluate(operandValue: string): boolean | InvalidValue {
    return this.valueTypeProvider.Primitives.Boolean.fromString(operandValue);
  }
}
