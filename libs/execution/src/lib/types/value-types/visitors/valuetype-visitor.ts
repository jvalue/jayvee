/* eslint-disable import/no-cycle */
import { BooleanValuetype } from '../boolean-valuetype';
import { DecimalValuetype } from '../decimal-valuetype';
import { IntegerValuetype } from '../integer-valuetype';
import { TextValuetype } from '../text-valuetype';

export abstract class ValuetypeVisitor<R> {
  abstract visitBoolean(valueType: BooleanValuetype): R;
  abstract visitDecimal(valueType: DecimalValuetype): R;
  abstract visitInteger(valueType: IntegerValuetype): R;
  abstract visitText(valueType: TextValuetype): R;
}
