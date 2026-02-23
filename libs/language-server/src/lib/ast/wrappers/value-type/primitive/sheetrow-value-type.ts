// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PrimitiveValueType } from './primitive-value-type';
import { type ValueTypeVisitor } from '../value-type';
import { type InternalValidValueRepresentation } from '../../../expressions';

export class SheetRowValueType extends PrimitiveValueType<string[]> {
  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitSheetRow(this);
  }

  override isAllowedAsRuntimeParameter(): false {
    return false;
  }

  override getName(): 'SheetRow' {
    return 'SheetRow';
  }

  override isInternalValidValueRepresentation(
    operandValue: InternalValidValueRepresentation,
  ): operandValue is string[] {
    return (
      Array.isArray(operandValue) &&
      operandValue.every((element) => typeof element === 'string')
    );
  }

  override isReferenceableByUser(): true {
    return true;
  }
}
