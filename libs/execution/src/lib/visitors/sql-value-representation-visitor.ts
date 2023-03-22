import {
  BooleanValuetype,
  DecimalValuetype,
  IntegerValuetype,
  TextValuetype,
} from '../types/valuetypes';
import { ValuetypeVisitor } from '../types/valuetypes/visitors/valuetype-visitor';

export class SQLValueRepresentationVisitor extends ValuetypeVisitor<
  (value: unknown) => string
> {
  visitBoolean(valuetype: BooleanValuetype): (value: unknown) => string {
    return (value: unknown) => {
      return valuetype.getStandardRepresentation(value)
        ? String.raw`'true'`
        : String.raw`'false'`;
    };
  }
  visitDecimal(valuetype: DecimalValuetype): (value: unknown) => string {
    return (value: unknown) => {
      return valuetype.getStandardRepresentation(value).toString();
    };
  }
  visitInteger(valuetype: IntegerValuetype): (value: unknown) => string {
    return (value: unknown) => {
      return valuetype.getStandardRepresentation(value).toString();
    };
  }
  visitText(valuetype: TextValuetype): (value: unknown) => string {
    return (value: unknown) => {
      const standardValueRepresentation =
        valuetype.getStandardRepresentation(value);
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
