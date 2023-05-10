// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { Valuetype, ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class ValuetypeAssignmentValuetypeImpl extends PrimitiveValuetype {
  override isConvertibleTo(target: Valuetype): boolean {
    return target === this;
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitValuetypeAssignment(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'valuetypeAssignment' {
    return 'valuetypeAssignment';
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
