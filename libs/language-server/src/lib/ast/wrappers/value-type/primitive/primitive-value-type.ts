// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type InternalValidValueRepresentation,
  InvalidValue,
} from '../../../expressions/internal-value-representation';
import { AbstractValueType } from '../abstract-value-type';
import { type ValueType } from '../value-type';
import { type ExampleDoc } from '../../typed-object/typed-object-wrapper';

export abstract class PrimitiveValueType<
  I extends InternalValidValueRepresentation = InternalValidValueRepresentation,
> extends AbstractValueType<I> {
  constructor() {
    super();
  }

  override isConvertibleTo(target: ValueType): boolean {
    return target.equals(this); // Primitive value types are always singletons
  }

  override equals(target: ValueType): boolean {
    return target === this;
  }

  protected override doGetContainedTypes(): [] {
    return [];
  }

  /**
   * The user documentation for the value type.
   * Text only, no comment characters.
   * Should be given for all user-referenceable value types {@link isReferenceableByUser}
   */
  getUserDocDescription(): string | undefined {
    return undefined;
  }

  getUserDocExamples(): ExampleDoc[] {
    const name = this.getName();
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    return [
      {
        code: `
valuetype TableSchema {
  tableColumn: ${name};
}
transfrom tableRowParser {
  from r oftype SheetRow;
  to tableRow oftye TableSchema;

  tableRow: {
    tableColumn: as${capitalizedName} (r . "tableColumn");
  };
}
block ExampleTableInterpreter oftype TableInterpreter {
  header: true;
  columns: TableSchema;
  parseWith: tableRowParser;
}`.trim(),
        description:
          `A block of type \`TableInterpreter\` that interprets data in the column "columnName" as \`${name}\`.
              `.trim(),
      },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fromString(_s: string): I | InvalidValue {
    return new InvalidValue(`Cannot parse ${this.getName()}`);
  }
}

export function isPrimitiveValueType(v: unknown): v is PrimitiveValueType {
  return v instanceof PrimitiveValueType;
}
