// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/evaluation';
import { PrimitiveValuetypeKeyword } from '../../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class BooleanValuetypeImpl extends PrimitiveValuetype<boolean> {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitBoolean(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return true;
  }

  override getName(): PrimitiveValuetypeKeyword {
    return 'boolean';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is boolean {
    return typeof operandValue === 'boolean';
  }
}

// Only export instance to enforce singleton
export const Boolean = new BooleanValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type BooleanValuetype = InstanceType<typeof BooleanValuetypeImpl>;

export function isBooleanValuetype(v: unknown): v is BooleanValuetype {
  return v === Boolean;
}
