import { Type } from '../../language-server/generated/ast';

import { DataTypeVisitor } from './visitors/DataTypeVisitor';
import { VisitableDataType } from './visitors/VisitableDataType';

export abstract class AbstractDataType implements VisitableDataType {
  constructor(readonly languageType: Type) {}

  abstract acceptVisitor<R>(visitor: DataTypeVisitor<R>): R;

  abstract isValid(value: unknown): boolean;
}
