/* eslint-disable import/no-cycle */
import { BooleanDataType } from '../BooleanDataType';
import { DecimalDataType } from '../DecimalDataType';
import { IntegerDataType } from '../IntegerDataType';
import { TextDataType } from '../TextDataType';

export abstract class DataTypeVisitor<R> {
  abstract visitBoolean(dataType: BooleanDataType): R;
  abstract visitDecimal(dataType: DecimalDataType): R;
  abstract visitInteger(dataType: IntegerDataType): R;
  abstract visitText(dataType: TextDataType): R;
}
