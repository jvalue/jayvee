import { BooleanDataType } from '../BooleanDataType';
import { DecimalDataType } from '../DecimalDataType';
import { IntegerDataType } from '../IntegerDataType';
import { TextDataType } from '../TextDataType';

import { DataTypeVisitor } from './DataTypeVisitor';

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
