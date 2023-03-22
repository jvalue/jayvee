/* eslint-disable import/no-cycle */
import { BooleanValuetype } from '../boolean-valuetype';
import { DecimalValuetype } from '../decimal-valuetype';
import { IntegerValuetype } from '../integer-valuetype';
import { TextValuetype } from '../text-valuetype';

export abstract class ValuetypeVisitor<R> {
  abstract visitBoolean(valuetype: BooleanValuetype): R;
  abstract visitDecimal(valuetype: DecimalValuetype): R;
  abstract visitInteger(valuetype: IntegerValuetype): R;
  abstract visitText(valuetype: TextValuetype): R;
}
