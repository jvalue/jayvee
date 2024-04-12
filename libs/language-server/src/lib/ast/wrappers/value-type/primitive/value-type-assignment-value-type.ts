// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import {
  ValuetypeAssignment as AstValuetypeAssignment,
  isValuetypeAssignment as isAstValuetypeAssignment,
} from '../../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';

class ValuetypeAssignmentValuetypeImpl extends PrimitiveValueType<AstValuetypeAssignment> {
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

// Only export instance to enforce singleton
export const ValuetypeAssignment = new ValuetypeAssignmentValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type ValuetypeAssignmentValuetype = InstanceType<
  typeof ValuetypeAssignmentValuetypeImpl
>;

export function isValuetypeAssignmentValuetype(
  v: unknown,
): v is ValuetypeAssignmentValuetype {
  return v === ValuetypeAssignment;
}