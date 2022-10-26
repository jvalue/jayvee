import { AbstractDataType } from './AbstractDataType';

export class DecimalDataType extends AbstractDataType {
  override isValid(value: any): boolean {
    if (typeof value === 'string') {
      return !!value.match(/[+-]?([0-9]*[.])?[0-9]+/);
    }

    return !Number.isNaN(value);
  }
}
