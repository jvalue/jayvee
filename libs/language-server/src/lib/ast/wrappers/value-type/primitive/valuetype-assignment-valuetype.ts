// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/evaluation';
import {
  ValuetypeAssignment as AstValuetypeAssignment,
  isValuetypeAssignment as isAstValuetypeAssignment,
} from '../../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class ValuetypeAssignmentValuetypeImpl extends PrimitiveValuetype<AstValuetypeAssignment> {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitValuetypeAssignment(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'valuetypeAssignment' {
    return 'valuetypeAssignment';
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
