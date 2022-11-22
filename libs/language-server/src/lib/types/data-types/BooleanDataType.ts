// eslint-disable-next-line import/no-cycle
import { AbstractDataType } from './AbstractDataType';
// eslint-disable-next-line import/no-cycle
import { DataTypeVisitor } from './visitors/DataTypeVisitor';

export class BooleanDataType extends AbstractDataType {
  private readonly BOOLEAN_STRING_REPRESENTATIONS = [
    'true',
    'True',
    'false',
    'False',
  ];

  override acceptVisitor<R>(visitor: DataTypeVisitor<R>): R {
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
    throw new Error(`Invalid value: ${value} for type ${this.languageType}`);
  }
}
