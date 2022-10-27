import { DataTypeVisitor } from './DataTypeVisitor';

export interface VisitableDataType {
  acceptVisitor(visitor: DataTypeVisitor<unknown>): void;
}
