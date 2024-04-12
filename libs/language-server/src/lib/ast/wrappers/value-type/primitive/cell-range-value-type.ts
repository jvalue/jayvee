// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import { type CellRangeWrapper } from '../../cell-range-wrapper';
import { isCellRangeWrapper } from '../../util/cell-range-util';
// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';

class CellRangeValuetypeImpl extends PrimitiveValueType<CellRangeWrapper> {
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
  ): operandValue is CellRangeWrapper {
    return isCellRangeWrapper(operandValue);
  }
}

// Only export instance to enforce singleton
export const CellRange = new CellRangeValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type CellRangeValuetype = InstanceType<typeof CellRangeValuetypeImpl>;

export function isCellRangeValuetype(v: unknown): v is CellRangeValuetype {
  return v === CellRange;
}