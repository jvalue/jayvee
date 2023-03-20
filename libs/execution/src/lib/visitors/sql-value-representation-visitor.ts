import {
  BooleanValueType,
  DecimalValueType,
  IntegerValueType,
  TextValueType,
} from '../types/value-types';
import { ValueTypeVisitor } from '../types/value-types/visitors/value-type-visitor';

export class SQLValueRepresentationVisitor extends ValueTypeVisitor<
  (value: unknown) => string
> {
  visitBoolean(valueType: BooleanValueType): (value: unknown) => string {
    return (value: unknown) => {
      return valueType.getStandardRepresentation(value)
        ? String.raw`'true'`
        : String.raw`'false'`;
    };
  }
  visitDecimal(valueType: DecimalValueType): (value: unknown) => string {
    return (value: unknown) => {
      return valueType.getStandardRepresentation(value).toString();
    };
  }
  visitInteger(valueType: IntegerValueType): (value: unknown) => string {
    return (value: unknown) => {
      return valueType.getStandardRepresentation(value).toString();
    };
  }
  visitText(valueType: TextValueType): (value: unknown) => string {
    return (value: unknown) => {
      const standardValueRepresentation =
        valueType.getStandardRepresentation(value);
      const escapedValueRepresentation = escapeSingleQuotes(
        standardValueRepresentation,
      );
      return `'${escapedValueRepresentation}'`;
    };
  }
}

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, `''`);
}
