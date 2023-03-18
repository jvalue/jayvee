// eslint-disable-next-line import/no-cycle
import { Valuetype } from './valuetype';
// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from './visitors/valuetype-visitor';

export class BooleanValuetype implements Valuetype {
  public readonly primitiveValuetype = 'boolean';

  private readonly BOOLEAN_STRING_REPRESENTATIONS = [
    'true',
    'True',
    'false',
    'False',
  ];

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
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
