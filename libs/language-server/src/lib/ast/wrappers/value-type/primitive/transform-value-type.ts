// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import {
  type TransformDefinition,
  isTransformDefinition,
} from '../../../generated/ast';
import { type ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';

export class TransformValuetype extends PrimitiveValueType<TransformDefinition> {
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
