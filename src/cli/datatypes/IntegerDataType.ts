/* eslint-disable import/no-cycle */
import { DataTypeVisitor } from './visitors/DataTypeVisitor';

import { AbstractDataType } from './AbstractDataType';

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
