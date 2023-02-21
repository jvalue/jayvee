// eslint-disable-next-line import/no-cycle
import { AbstractDataType } from './AbstractDataType';
// eslint-disable-next-line import/no-cycle
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

  override getStandardRepresentation(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return Number.parseInt(value, 10);
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Invalid value: ${value} for type ${this.dataType}`);
  }
}
