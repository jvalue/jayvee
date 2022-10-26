import { AbstractDataType } from './AbstractDataType';

export class TextDataType extends AbstractDataType {
  override isValid(value: unknown): boolean {
    return typeof value === 'string';
  }
}
