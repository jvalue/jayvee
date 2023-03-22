// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from './valuetype-visitor';

export interface VisitableValuetype {
  acceptVisitor(visitor: ValuetypeVisitor<unknown>): void;
}
