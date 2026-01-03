// SPDX-FileCopyrightText: 2026 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type TableRow,
  type InternalValidValueRepresentation,
} from '../../../expressions/internal-value-representation';
import { type ValueType, type ValueTypeVisitor } from '../value-type';

import { PrimitiveValueType } from './primitive-value-type';
import { TABLEROW_TYPEGUARD } from '../../../expressions';

export class TableRowValueType extends PrimitiveValueType<TableRow> {
  constructor(private schema: Map<string, ValueType>) {
    super();
  }

  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitTableRow(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'TableRow' {
    return 'TableRow';
  }

  private equalSchema(otherSchema: Map<string, ValueType>): boolean {
    if (this.schema.size !== otherSchema.size) {
      return false;
    }
    for (const [columnName, cellValue] of this.schema) {
      const otherCellValue = otherSchema.get(columnName);
      if (cellValue !== otherCellValue) {
        return false;
      }
      if (otherCellValue === undefined && !otherSchema.has(columnName)) {
        return false;
      }
    }
    return true;
  }

  override equals(target: ValueType): boolean {
    return (
      target instanceof TableRowValueType && this.equalSchema(target.schema)
    );
  }

  override isInternalValidValueRepresentation(
    operandValue: InternalValidValueRepresentation,
  ): operandValue is TableRow {
    return TABLEROW_TYPEGUARD(operandValue);
  }
}
