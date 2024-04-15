// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import type { ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';

class TextValuetypeImpl extends PrimitiveValueType<string> {
  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitText(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return true;
  }

  override getName(): 'text' {
    return 'text';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is string {
    return typeof operandValue === 'string';
  }

  override isReferenceableByUser() {
    return true;
  }

  override getUserDoc(): string {
    return `
A text value. 
Example: "Hello World"
`.trim();
  }
}

// Only export instance to enforce singleton
export const Text = new TextValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type TextValuetype = InstanceType<typeof TextValuetypeImpl>;

export function isTextValuetype(v: unknown): v is TextValuetype {
  return v === Text;
}
