// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { Valuetype, ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class ConstraintValuetypeImpl extends PrimitiveValuetype {
  override isConvertibleTo(target: Valuetype): boolean {
    return target === this;
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitConstraint(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'constraint' {
    return 'constraint';
  }
}

// Only export instance to enforce singleton
export const Constraint = new ConstraintValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type ConstraintValuetype = InstanceType<typeof ConstraintValuetypeImpl>;

export function isConstraintValuetype(v: unknown): v is ConstraintValuetype {
  return v === Constraint;
}
