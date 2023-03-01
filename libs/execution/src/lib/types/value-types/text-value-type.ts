// eslint-disable-next-line import/no-cycle
import { AbstractValueType } from './abstract-value-type';
// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from './visitors/value-type-visitor';

export class TextValueType extends AbstractValueType {
  override isValid(value: unknown): boolean {
    return typeof value === 'string';
  }

  override acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return visitor.visitText(this);
  }

  override getStandardRepresentation(value: unknown): string {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Invalid value: ${value} for type ${this.valueType}`);
  }
}
