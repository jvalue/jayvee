/* eslint-disable import/no-cycle */
import { AbstractDataType } from './AbstractDataType';
import { DataTypeVisitor } from './visitors/DataTypeVisitor';

export class BooleanDataType extends AbstractDataType {
  private readonly BOOLEAN_STRING_REPRESENTATIONS = [
    'true',
    'True',
    'false',
    'False',
  ];

  override acceptVisitor<R>(visitor: DataTypeVisitor<R>): R {
    return visitor.visitBoolean(this);
  }

  override isValid(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return true;
    }
    if (typeof value === 'string') {
      return this.BOOLEAN_STRING_REPRESENTATIONS.includes(value);
    }

    return false;
  }
}
