/* eslint-disable import/no-cycle */
import { AbstractDataType } from './AbstractDataType';
import { DataTypeVisitor } from './visitors/DataTypeVisitor';

export class TextDataType extends AbstractDataType {
  override isValid(value: unknown): boolean {
    return typeof value === 'string';
  }

  override acceptVisitor<R>(visitor: DataTypeVisitor<R>): R {
    return visitor.visitText(this);
  }
}
