// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetype } from './primitive-valuetype';
// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from './visitors/valuetype-visitor';

export class TextValuetype implements PrimitiveValuetype<string> {
  public readonly primitiveValuetypeKeyword = 'text';

  isValid(value: unknown): boolean {
    return typeof value === 'string';
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
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
      `Invalid value: ${value} for type ${this.primitiveValuetypeKeyword}`,
    );
  }
}
