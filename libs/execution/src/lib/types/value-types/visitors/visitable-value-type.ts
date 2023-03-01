// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from './value-type-visitor';

export interface VisitableValueType {
  acceptVisitor(visitor: ValueTypeVisitor<unknown>): void;
}
