import {
  BooleanValueType,
  DecimalValueType,
  IntegerValueType,
  TextValueType,
  ValueTypeVisitor,
} from '@jayvee/execution';

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
      return `'${valueType.getStandardRepresentation(value)}'`;
    };
  }
}
