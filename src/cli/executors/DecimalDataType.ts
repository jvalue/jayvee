import { AbstractDataType } from './AbstractDataType';

export class DecimalDataType extends AbstractDataType {
  override isValid(value: any): boolean {
    return true;
  }
}
