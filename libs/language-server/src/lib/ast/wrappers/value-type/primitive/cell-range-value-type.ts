// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import {
  type CellRangeLiteral,
  isCellRangeLiteral,
} from '../../../generated/ast';
import { type ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';

export class CellRangeValuetype extends PrimitiveValueType<CellRangeLiteral> {
  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitCellRange(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'CellRange' {
    return 'CellRange';
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is CellRangeLiteral {
    return isCellRangeLiteral(operandValue);
  }
}
