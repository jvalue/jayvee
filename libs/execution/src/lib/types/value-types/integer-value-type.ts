// eslint-disable-next-line import/no-cycle
import { ValueType } from './abstract-value-type';
// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from './visitors/value-type-visitor';

export class IntegerValueType implements ValueType {
  public readonly primitiveValuetype = 'integer';

  isValid(value: unknown): boolean {
    if (typeof value === 'string') {
      return !!value.match(/[+-]?[0-9]+/);
    }

    return Number.isInteger(value);
  }

  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitInteger(this);
  }

  getStandardRepresentation(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return Number.parseInt(value, 10);
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${value} for type ${this.primitiveValuetype}`,
    );
  }
}
