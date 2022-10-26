import { AbstractDataType } from './AbstractDataType';

export class IntegerDataType extends AbstractDataType {
  override isValid(value: unknown): boolean {
    if (typeof value === 'string') {
      return !!value.match(/[+-]?[0-9]+/);
    }

    return Number.isInteger(value);
  }
}
