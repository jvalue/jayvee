// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { AtomicValuetype, PrimitiveType } from '../types';
import { ValuetypeVisitor } from '../types/valuetypes/visitors/valuetype-visitor';

export class SQLColumnTypeVisitor extends ValuetypeVisitor<string> {
  override visitBoolean(): string {
    return 'boolean';
  }
  override visitDecimal(): string {
    return 'real';
  }
  override visitInteger(): string {
    return 'integer';
  }
  override visitText(): string {
    return 'text';
  }
  override visitAtomicValuetype<T extends PrimitiveType>(
    valuetype: AtomicValuetype<T>,
  ): string {
    return valuetype.acceptVisitor(this);
  }
}
