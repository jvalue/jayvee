/* eslint-disable import/no-cycle */
import { DataTypeVisitor } from './visitors/DataTypeVisitor';

import { AbstractDataType } from './AbstractDataType';

export class TextDataType extends AbstractDataType {
  override isValid(value: unknown): boolean {
    return typeof value === 'string';
  }

  override acceptVisitor<R>(visitor: DataTypeVisitor<R>): R {
    return visitor.visitText(this);
  }
}
