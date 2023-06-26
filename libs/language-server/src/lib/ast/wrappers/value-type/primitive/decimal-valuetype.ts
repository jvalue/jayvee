// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import { PrimitiveValuetypeKeyword } from '../../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class DecimalValuetypeImpl extends PrimitiveValuetype<number> {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitDecimal(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return true;
  }

  override getName(): PrimitiveValuetypeKeyword {
    return 'decimal';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is number {
    return typeof operandValue === 'number' && Number.isFinite(operandValue);
  }
}

// Only export instance to enforce singleton
export const Decimal = new DecimalValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type DecimalValuetype = InstanceType<typeof DecimalValuetypeImpl>;

export function isDecimalValuetype(v: unknown): v is DecimalValuetype {
  return v === Decimal;
}
