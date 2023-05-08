// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AtomicValuetype,
  ValuetypeVisitor,
} from '@jvalue/jayvee-language-server';

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
  override visitAtomicValuetype(valuetype: AtomicValuetype): string {
    return valuetype.acceptVisitor(this);
  }
}