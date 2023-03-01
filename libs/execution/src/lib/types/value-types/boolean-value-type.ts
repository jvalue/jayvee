// eslint-disable-next-line import/no-cycle
import { AbstractValueType } from './abstract-value-type';
// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from './visitors/value-type-visitor';

export class BooleanValueType extends AbstractValueType {
  private readonly BOOLEAN_STRING_REPRESENTATIONS = [
    'true',
    'True',
    'false',
    'False',
  ];

  override acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitBoolean(this);
  }

  override isValid(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return true;
    }
    if (typeof value === 'string') {
      return this.BOOLEAN_STRING_REPRESENTATIONS.includes(value);
    }

    return false;
  }

  override getStandardRepresentation(value: unknown): boolean {
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

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Invalid value: ${value} for type ${this.valueType}`);
  }
}
