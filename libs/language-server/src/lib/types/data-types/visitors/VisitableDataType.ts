// eslint-disable-next-line import/no-cycle
import { DataTypeVisitor } from './DataTypeVisitor';

export interface VisitableDataType {
  acceptVisitor(visitor: DataTypeVisitor<unknown>): void;
}
