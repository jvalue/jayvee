/* eslint-disable import/no-cycle */
import { BooleanValueType } from '../boolean-value-type';
import { DecimalValueType } from '../decimal-value-type';
import { IntegerValueType } from '../integer-value-type';
import { TextValueType } from '../text-value-type';

export abstract class ValueTypeVisitor<R> {
  abstract visitBoolean(valueType: BooleanValueType): R;
  abstract visitDecimal(valueType: DecimalValueType): R;
  abstract visitInteger(valueType: IntegerValueType): R;
  abstract visitText(valueType: TextValueType): R;
}
