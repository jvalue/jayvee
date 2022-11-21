/* eslint-disable import/no-cycle */
import { AbstractDataType } from './AbstractDataType';
import { DataTypeVisitor } from './visitors';

export class DecimalDataType extends AbstractDataType {
  override isValid(value: unknown): boolean {
    if (typeof value === 'string') {
      return !!value.match(/[+-]?([0-9]*[.])?[0-9]+/);
    }

    return !Number.isNaN(value);
  }

  override acceptVisitor<R>(visitor: DataTypeVisitor<R>): R {
    return visitor.visitDecimal(this);
  }

  override getStandardRepresentation(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return Number.parseFloat(value);
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Invalid value: ${value} for type ${this.languageType}`);
  }
}
