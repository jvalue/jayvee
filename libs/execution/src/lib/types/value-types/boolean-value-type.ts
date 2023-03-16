// eslint-disable-next-line import/no-cycle
import { ValueType } from './abstract-value-type';
// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from './visitors/value-type-visitor';

export class BooleanValueType implements ValueType {
  public readonly primitiveValuetype = 'boolean';

  private readonly BOOLEAN_STRING_REPRESENTATIONS = [
    'true',
    'True',
    'false',
    'False',
  ];

  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitBoolean(this);
  }

  isValid(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return true;
    }
    if (typeof value === 'string') {
      return this.BOOLEAN_STRING_REPRESENTATIONS.includes(value);
    }

    return false;
  }

  getStandardRepresentation(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      switch (value.toLowerCase()) {
        case 'true':
          return true;
        default:
          return false;
      }
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${value} for type ${this.primitiveValuetype}`,
    );
  }
}
