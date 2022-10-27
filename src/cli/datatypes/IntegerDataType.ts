/* eslint-disable import/no-cycle */
import { AbstractDataType } from './AbstractDataType';
import { DataTypeVisitor } from './visitors/DataTypeVisitor';

export class IntegerDataType extends AbstractDataType {
  override isValid(value: unknown): boolean {
    if (typeof value === 'string') {
      return !!value.match(/[+-]?[0-9]+/);
    }

    return Number.isInteger(value);
  }

  override acceptVisitor<R>(visitor: DataTypeVisitor<R>): R {
    return visitor.visitInteger(this);
  }
}
