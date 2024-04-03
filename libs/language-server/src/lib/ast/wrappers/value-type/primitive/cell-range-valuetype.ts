// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
import {
  type CellRangeWrapper,
  isCellRangeWrapper,
} from '../../cell-range-wrapper';
// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class CellRangeValuetypeImpl extends PrimitiveValuetype<CellRangeWrapper> {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
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
