// eslint-disable-next-line import/no-cycle
import { AbstractValueType } from './abstract-value-type';
// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from './visitors/value-type-visitor';

export class DecimalValueType extends AbstractValueType {
  override isValid(value: unknown): boolean {
    if (typeof value === 'string') {
      return !!value.match(/[+-]?([0-9]*[.])?[0-9]+/);
    }

    return !Number.isNaN(value);
  }

  override acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
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
    throw new Error(`Invalid value: ${value} for type ${this.valueType}`);
  }
}
