// eslint-disable-next-line import/no-cycle
import { ValueType } from './abstract-value-type';
// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from './visitors/value-type-visitor';

export class TextValueType implements ValueType<string> {
  public readonly primitiveValuetype = 'text';

  isValid(value: unknown): boolean {
    return typeof value === 'string';
  }

  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitText(this);
  }

  getStandardRepresentation(value: unknown): string {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }

    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid value: ${value} for type ${this.primitiveValuetype}`,
    );
  }
}
