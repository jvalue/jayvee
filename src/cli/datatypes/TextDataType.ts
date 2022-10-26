import { AbstractDataType } from './AbstractDataType';

export class TextDataType extends AbstractDataType {
  override isValid(value: any): boolean {
    return typeof value === 'string';
  }
}
