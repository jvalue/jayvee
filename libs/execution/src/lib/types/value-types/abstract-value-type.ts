import { PrimitiveValuetype } from '@jvalue/language-server';

// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from './visitors/value-type-visitor';
// eslint-disable-next-line import/no-cycle
import { VisitableValueType } from './visitors/visitable-value-type';

export interface ValueType<T = unknown> extends VisitableValueType {
  readonly primitiveValuetype: PrimitiveValuetype;

  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R;

  isValid(value: unknown): boolean;

  getStandardRepresentation(value: unknown): T;
}
