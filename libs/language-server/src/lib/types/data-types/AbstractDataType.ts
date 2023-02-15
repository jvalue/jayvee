import { DataType } from '../../ast/generated/ast';

// eslint-disable-next-line import/no-cycle
import { DataTypeVisitor } from './visitors/DataTypeVisitor';
// eslint-disable-next-line import/no-cycle
import { VisitableDataType } from './visitors/VisitableDataType';

export abstract class AbstractDataType implements VisitableDataType {
  constructor(readonly dataType: DataType) {}

  abstract acceptVisitor<R>(visitor: DataTypeVisitor<R>): R;

  abstract isValid(value: unknown): boolean;

  abstract getStandardRepresentation(value: unknown): unknown;
}
