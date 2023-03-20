// eslint-disable-next-line import/no-cycle
import { Valuetype } from './valuetype';
// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from './visitors/valuetype-visitor';

export class IntegerValuetype implements Valuetype {
  public readonly primitiveValuetype = 'integer';

  isValid(value: unknown): boolean {
    if (typeof value === 'string') {
      return /^[+-]?[0-9]+$/.test(value);
    }

    return Number.isInteger(value);
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
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
