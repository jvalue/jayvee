import {
  BooleanDataType,
  DataTypeVisitor,
  DecimalDataType,
  IntegerDataType,
  TextDataType,
} from '@jayvee/language-server';

export class PostgresValueRepresentationVisitor extends DataTypeVisitor<
  (value: unknown) => string
> {
  visitBoolean(dataType: BooleanDataType): (value: unknown) => string {
    return (value: unknown) => {
      return dataType.getStandardRepresentation(value)
        ? String.raw`'true'`
        : String.raw`'false'`;
    };
  }
  visitDecimal(dataType: DecimalDataType): (value: unknown) => string {
    return (value: unknown) => {
      return dataType.getStandardRepresentation(value).toString();
    };
  }
  visitInteger(dataType: IntegerDataType): (value: unknown) => string {
    return (value: unknown) => {
      return dataType.getStandardRepresentation(value).toString();
    };
  }
  visitText(dataType: TextDataType): (value: unknown) => string {
    return (value: unknown) => {
      return `'${dataType.getStandardRepresentation(value)}'`;
    };
  }
}
