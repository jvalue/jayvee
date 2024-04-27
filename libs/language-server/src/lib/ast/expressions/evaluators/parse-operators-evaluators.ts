// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { DefaultUnaryOperatorEvaluator } from '../operator-evaluator';
import { STRING_TYPEGUARD } from '../typeguards';

export class AsTextOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  string,
  string
> {
  constructor() {
    super('asText', STRING_TYPEGUARD);
  }
  override doEvaluate(operandValue: string): string | undefined {
    return operandValue;
  }
}

export class AsDecimalOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  string,
  number
> {
  constructor() {
    super('asDecimal', STRING_TYPEGUARD);
  }
  override doEvaluate(operandValue: string): number {
    return Number.parseFloat(operandValue);
  }
}

export class AsIntegerOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  string,
  number
> {
  constructor() {
    super('asInteger', STRING_TYPEGUARD);
  }
  override doEvaluate(operandValue: string): number {
    return Number.parseInt(operandValue, 10);
  }
}

export class AsBooleanOperatorEvaluator extends DefaultUnaryOperatorEvaluator<
  string,
  boolean
> {
  constructor() {
    super('asBoolean', STRING_TYPEGUARD);
  }
  override doEvaluate(operandValue: string): boolean {
    return operandValue === 'true';
  }
}
