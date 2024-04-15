// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import type { ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';

class RegexValuetypeImpl extends PrimitiveValueType<RegExp> {
  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitRegex(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'Regex' {
    return 'Regex';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is RegExp {
    return operandValue instanceof RegExp;
  }
}

// Only export instance to enforce singleton
export const Regex = new RegexValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type RegexValuetype = InstanceType<typeof RegexValuetypeImpl>;

export function isRegexValuetype(v: unknown): v is RegexValuetype {
  return v === Regex;
}
