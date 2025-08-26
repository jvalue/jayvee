// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type InternalValidValueRepresentation,
  InvalidValue,
} from '../../../expressions/internal-value-representation';
import { INVALID_TYPEGUARD } from '../../../expressions/typeguards';
import { type ValueType, type ValueTypeVisitor } from '../value-type';

import { DecimalValuetype, parseDecimal } from './decimal-value-type';
import { PrimitiveValueType } from './primitive-value-type';

export class IntegerValuetype extends PrimitiveValueType<number> {
  override isConvertibleTo(target: ValueType): boolean {
    return super.isConvertibleTo(target) || target instanceof DecimalValuetype;
  }

  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitInteger(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return true;
  }

  override getName(): 'integer' {
    return 'integer';
  }

  override isInternalValidValueRepresentation(
    operandValue: InternalValidValueRepresentation,
  ): operandValue is number {
    return typeof operandValue === 'number' && Number.isInteger(operandValue);
  }

  override isReferenceableByUser() {
    return true;
  }

  override getUserDoc(): string {
    return `
An integer value.
Example: 3
`.trim();
  }

  override fromString(s: string): number | InvalidValue {
    /**
     * Reuse decimal number parsing to capture valid scientific notation
     * of integers like 5.3e3 = 5300. In contrast to decimal, if the final number
     * is not a valid integer, returns undefined.
     */
    const decimalNumber = parseDecimal(s);

    if (INVALID_TYPEGUARD(decimalNumber)) {
      return decimalNumber;
    }

    const integerNumber = Math.trunc(decimalNumber);

    if (decimalNumber !== integerNumber) {
      return new InvalidValue(`${decimalNumber} is a decimal, not an integer`);
    }

    return integerNumber;
  }
}
