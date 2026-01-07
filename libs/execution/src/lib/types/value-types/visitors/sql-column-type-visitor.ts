// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AtomicValueType,
  onlyElementOrUndefined,
  ValueTypeVisitor,
} from '@jvalue/jayvee-language-server';

export class SQLColumnTypeVisitor extends ValueTypeVisitor<string> {
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

  override visitAtomicValueType(valueType: AtomicValueType): string {
    const containedTypes = valueType.getContainedTypes();
    assert(containedTypes !== undefined);
    const containedType = onlyElementOrUndefined(containedTypes);
    if (containedType === undefined) {
      throw new Error(
        'Can only determine sql column type for value types with one property',
      );
    }
    return containedType.acceptVisitor(this);
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
      'No visit implementation given for valueType assignments. Cannot be the type of a column.',
    );
  }

  override visitValuetypeDefinition(): string {
    throw new Error(
      'No visit implementation given for valueType definitions. Cannot be the type of a column.',
    );
  }

  override visitCollection(): string {
    throw new Error(
      'No visit implementation given for collections. Cannot be the type of a column.',
    );
  }

  override visitTransform(): string {
    throw new Error(
      'No visit implementation given for transforms. Cannot be the type of a column.',
    );
  }
}
