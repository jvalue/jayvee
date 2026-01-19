// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValidValueRepresentation } from '../../../expressions/internal-value-representation';
import {
  type ValuetypeDefinition as AstValuetypeDefinition,
  isValuetypeDefinition as isAstValuetypeDefinition,
} from '../../../generated/ast';
import { type ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';

export class ValuetypeDefinitionValuetype extends PrimitiveValueType<AstValuetypeDefinition> {
  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitValuetypeDefinition(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'ValuetypeDefinition' {
    return 'ValuetypeDefinition';
  }

  override isInternalValidValueRepresentation(
    operandValue: InternalValidValueRepresentation,
  ): operandValue is AstValuetypeDefinition {
    return isAstValuetypeDefinition(operandValue);
  }
}
