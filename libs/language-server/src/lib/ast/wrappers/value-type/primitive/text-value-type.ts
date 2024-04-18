// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import { type ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';

export class TextValuetype extends PrimitiveValueType<string> {
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
