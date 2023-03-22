import { ExecutionContext } from '../../execution-context';

// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from './visitors/valuetype-visitor';
// eslint-disable-next-line import/no-cycle
import { VisitableValuetype } from './visitors/visitable-valuetype';

export interface Valuetype<T = unknown> extends VisitableValuetype {
  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R;

  isValid(value: unknown, context: ExecutionContext): boolean;

  getStandardRepresentation(value: unknown): T;
}
