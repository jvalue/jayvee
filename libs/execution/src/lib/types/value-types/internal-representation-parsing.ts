// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AtomicValueType,
  type BooleanValuetype,
  type DecimalValuetype,
  type IntegerValuetype,
  type InternalValueRepresentation,
  type TextValuetype,
  type ValueType,
  ValueTypeVisitor,
} from '@jvalue/jayvee-language-server';

export function parseValueToInternalRepresentation<
  I extends InternalValueRepresentation,
>(value: string, valueType: ValueType<I>): I | undefined {
  const visitor = new InternalRepresentationParserVisitor(value);
  const result = valueType.acceptVisitor(visitor);
  if (!valueType.isInternalValueRepresentation(result)) {
    return undefined;
  }
  return result;
}

class InternalRepresentationParserVisitor extends ValueTypeVisitor<
  InternalValueRepresentation | undefined
> {
  constructor(private value: string) {
    super();
  }

  visitBoolean(vt: BooleanValuetype): boolean | undefined {
    return vt.fromString(this.value);
  }

  visitDecimal(vt: DecimalValuetype): number | undefined {
    return vt.fromString(this.value);
  }

  visitInteger(vt: IntegerValuetype): number | undefined {
    return vt.fromString(this.value);
  }

  visitText(vt: TextValuetype): string {
    return vt.fromString(this.value);
  }

  visitAtomicValueType(
    valueType: AtomicValueType,
  ): InternalValueRepresentation | undefined {
    const supertype = valueType.getSupertype();
    assert(supertype !== undefined);

    return supertype.acceptVisitor(this);
  }

  visitCellRange(): undefined {
    return undefined;
  }

  visitCollection(): undefined {
    return undefined;
  }

  visitConstraint(): undefined {
    return undefined;
  }

  visitRegex(): undefined {
    return undefined;
  }

  visitTransform(): undefined {
    return undefined;
  }

  visitValuetypeAssignment(): undefined {
    return undefined;
  }
}
