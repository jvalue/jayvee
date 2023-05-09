// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { Valuetype, ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class ConstraintValuetype extends PrimitiveValuetype {
  override isConvertibleTo(target: Valuetype): boolean {
    return target === this;
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitConstraint(this);
  }
}

export const Constraint = new ConstraintValuetype();