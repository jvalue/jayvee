// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import {
  ConstraintDefinition,
  isConstraintDefinition,
} from '../../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class ConstraintValuetypeImpl extends PrimitiveValuetype<ConstraintDefinition> {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitConstraint(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'constraint' {
    return 'constraint';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is ConstraintDefinition {
    return isConstraintDefinition(operandValue);
  }
}

// Only export instance to enforce singleton
export const Constraint = new ConstraintValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type ConstraintValuetype = InstanceType<typeof ConstraintValuetypeImpl>;

export function isConstraintValuetype(v: unknown): v is ConstraintValuetype {
  return v === Constraint;
}
