import {
  BooleanValuetype,
  DecimalValuetype,
  IntegerValuetype,
  TextValuetype,
} from '../types/value-types';
import { ValuetypeVisitor } from '../types/value-types/visitors/valuetype-visitor';

export class SQLValueRepresentationVisitor extends ValuetypeVisitor<
  (value: unknown) => string
> {
  visitBoolean(valueType: BooleanValuetype): (value: unknown) => string {
    return (value: unknown) => {
      return valueType.getStandardRepresentation(value)
        ? String.raw`'true'`
        : String.raw`'false'`;
    };
  }
  visitDecimal(valueType: DecimalValuetype): (value: unknown) => string {
    return (value: unknown) => {
      return valueType.getStandardRepresentation(value).toString();
    };
  }
  visitInteger(valueType: IntegerValuetype): (value: unknown) => string {
    return (value: unknown) => {
      return valueType.getStandardRepresentation(value).toString();
    };
  }
  visitText(valueType: TextValuetype): (value: unknown) => string {
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
