// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import {
  TransformDefinition,
  isTransformDefinition,
} from '../../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';

class TransformValuetypeImpl extends PrimitiveValueType<TransformDefinition> {
  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitTransform(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'Transform' {
    return 'Transform';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is TransformDefinition {
    return isTransformDefinition(operandValue);
  }
}

// Only export instance to enforce singleton
export const Transform = new TransformValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type TransformValuetype = InstanceType<typeof TransformValuetypeImpl>;

export function isTransformValuetype(v: unknown): v is TransformValuetype {
  return v === Transform;
}
