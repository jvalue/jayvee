// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PrimitiveValueType } from './primitive-value-type';
import { type ValueTypeVisitor } from '../value-type';
import { type InternalValidValueRepresentation } from '../../../expressions';
import { type ExampleDoc } from '../../typed-object/typed-object-wrapper';

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

  override getUserDocDescription(): string {
    return `
The values of a row inside a sheet. Only usable inside a transform that parses SheetRows into a value type.
Accessible via the dot operator (see example).
`.trim();
  }

  override getUserDocExamples(): ExampleDoc[] {
    return [
      {
        code: `
valuetype Coordinate {
  x: decimal;
  y: decimal;
}
transfrom coordinateParser {
  from r oftype SheetRow;
  to coord oftye Coordinate;

  coord: {
    x: asDecimal (r . "x");
    y: asDecimal (r . 1);
  };
}
block ExampleTableInterpreter oftype TableInterpreter {
  header: true;
  columns: Coordinate;
  parseWith: CoordinateParser;
}`.trim(),
        description:
          'A transform, used in a block of type `TableInterpreter`, that interprets a `SheetRow` into a table row with columns `x` and `y`.',
      },
    ];
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
