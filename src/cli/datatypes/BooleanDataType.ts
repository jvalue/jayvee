import { AbstractDataType } from './AbstractDataType';

export class BooleanDataType extends AbstractDataType {
  private readonly BOOLEAN_STRING_REPRESENTATIONS = [
    'true',
    'True',
    'false',
    'False',
  ];

  override isValid(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return true;
    }
    if (typeof value === 'string') {
      return this.BOOLEAN_STRING_REPRESENTATIONS.includes(value);
    }

    return false;
  }
}
