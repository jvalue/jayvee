import { Type } from '../../language-server/generated/ast';

export abstract class AbstractDataType {
  constructor(readonly languageType: Type) {}

  abstract isValid(value: any): boolean;
}
