// eslint-disable-next-line import/no-cycle
import { AbstractValueType } from './abstract-value-type';
// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from './visitors/value-type-visitor';

export class DecimalValueType extends AbstractValueType {
  private readonly DOT_SEPARATOR_REGEX = /^[+-]?([0-9]*[.])?[0-9]+$/;
  private readonly COMMA_SEPARATOR_REGEX = /^[+-]?([0-9]*[,])?[0-9]+$/;

  override isValid(value: unknown): boolean {
    if (typeof value === 'string') {
      return (
        this.DOT_SEPARATOR_REGEX.test(value) ||
        this.COMMA_SEPARATOR_REGEX.test(value)
      );
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
      let stringValue: string = value;
      if (this.COMMA_SEPARATOR_REGEX.test(stringValue)) {
        stringValue = stringValue.replace(',', '.');
      }
      return Number.parseFloat(stringValue);
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Invalid value: ${value} for type ${this.valueType}`);
  }
}
