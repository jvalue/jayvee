// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import {
  type ConstraintDefinition,
  isConstraintDefinition,
} from '../../../generated/ast';
import { type ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';

export class ConstraintValuetype extends PrimitiveValueType<ConstraintDefinition> {
  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitConstraint(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'Constraint' {
    return 'Constraint';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is ConstraintDefinition {
    return isConstraintDefinition(operandValue);
  }
}
