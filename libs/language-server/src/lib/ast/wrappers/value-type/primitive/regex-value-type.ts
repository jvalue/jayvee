// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation.js';
import { type ValueTypeVisitor } from '../value-type.js';

import { PrimitiveValueType } from './primitive-value-type.js';

export class RegexValuetype extends PrimitiveValueType<RegExp> {
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
