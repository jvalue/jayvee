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

  override visitRegex(): string {
    throw new Error(
      'No visit implementation given for regex. Cannot be the type of a column.',
    );
  }

  override visitCellRange(): string {
    throw new Error(
      'No visit implementation given for cell ranges. Cannot be the type of a column.',
    );
  }

  override visitConstraint(): string {
    throw new Error(
      'No visit implementation given for constraints. Cannot be the type of a column.',
    );
  }

  override visitValuetypeAssignment(): string {
    throw new Error(
      'No visit implementation given for valuetype assignments. Cannot be the type of a column.',
    );
  }

  override visitCollection(): string {
    throw new Error(
      'No visit implementation given for collections. Cannot be the type of a column.',
    );
  }
}
