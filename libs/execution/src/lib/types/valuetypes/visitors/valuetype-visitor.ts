// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable import/no-cycle */
import { AtomicValuetype } from '../atomic-valuetype';
import { PrimitiveType } from '../primitive';
import { BooleanValuetype } from '../primitive/boolean-valuetype';
import { DecimalValuetype } from '../primitive/decimal-valuetype';
import { IntegerValuetype } from '../primitive/integer-valuetype';
import { TextValuetype } from '../primitive/text-valuetype';

export abstract class ValuetypeVisitor<R = unknown> {
  abstract visitBoolean(valuetype: BooleanValuetype): R;
  abstract visitDecimal(valuetype: DecimalValuetype): R;
  abstract visitInteger(valuetype: IntegerValuetype): R;
  abstract visitText(valuetype: TextValuetype): R;
  abstract visitAtomicValuetype<T extends PrimitiveType>(
    valuetype: AtomicValuetype<T>,
  ): R;
}
