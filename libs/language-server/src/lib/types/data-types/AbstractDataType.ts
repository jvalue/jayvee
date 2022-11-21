import { Type } from '../../generated/ast';

// eslint-disable-next-line import/no-cycle
import { DataTypeVisitor, VisitableDataType } from './visitors';

export abstract class AbstractDataType implements VisitableDataType {
  constructor(readonly languageType: Type) {}

  abstract acceptVisitor<R>(visitor: DataTypeVisitor<R>): R;

  abstract isValid(value: unknown): boolean;

  abstract getStandardRepresentation(value: unknown): unknown;
}
