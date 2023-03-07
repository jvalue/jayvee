import { PrimitiveValueType } from '@jvalue/language-server';

// eslint-disable-next-line import/no-cycle
import { ValueTypeVisitor } from './visitors/value-type-visitor';
// eslint-disable-next-line import/no-cycle
import { VisitableValueType } from './visitors/visitable-value-type';

export abstract class AbstractValueType implements VisitableValueType {
  constructor(readonly valueType: PrimitiveValueType) {}

  abstract acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R;

  abstract isValid(value: unknown): boolean;

  abstract getStandardRepresentation(value: unknown): unknown;
}
