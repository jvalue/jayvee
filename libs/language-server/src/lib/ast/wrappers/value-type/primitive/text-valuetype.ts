// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/evaluation';
import { PrimitiveValuetypeKeyword } from '../../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class TextValuetypeImpl extends PrimitiveValuetype<string> {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitText(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return true;
  }

  override getName(): PrimitiveValuetypeKeyword {
    return 'text';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is string {
    return typeof operandValue === 'string';
  }
}

// Only export instance to enforce singleton
export const Text = new TextValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type TextValuetype = InstanceType<typeof TextValuetypeImpl>;

export function isTextValuetype(v: unknown): v is TextValuetype {
  return v === Text;
}
