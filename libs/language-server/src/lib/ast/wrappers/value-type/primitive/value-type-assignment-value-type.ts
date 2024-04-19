// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation.js';
import {
  type ValuetypeAssignment as AstValuetypeAssignment,
  isValuetypeAssignment as isAstValuetypeAssignment,
} from '../../../generated/ast.js';
import { type ValueTypeVisitor } from '../value-type.js';

import { PrimitiveValueType } from './primitive-value-type.js';

export class ValuetypeAssignmentValuetype extends PrimitiveValueType<AstValuetypeAssignment> {
  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitValuetypeAssignment(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'ValuetypeAssignment' {
    return 'ValuetypeAssignment';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is AstValuetypeAssignment {
    return isAstValuetypeAssignment(operandValue);
  }
}
