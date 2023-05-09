// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { Boolean } from './boolean-valuetype';
import { Decimal } from './decimal-valuetype';
import { Integer } from './integer-valuetype';
import { PrimitiveValuetype } from './primitive-valuetype';
import { Text } from './text-valuetype';

export * from './primitive-valuetype';
export const PrimitiveValuetypes: {
  Boolean: PrimitiveValuetype;
  Decimal: PrimitiveValuetype;
  Integer: PrimitiveValuetype;
  Text: PrimitiveValuetype;
} = {
  Boolean: Boolean,
  Decimal: Decimal,
  Integer: Integer,
  Text: Text,
};
