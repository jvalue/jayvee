import { ConstructorClass } from '@jvalue/language-server';

import { ConstraintExecutor } from './constraint-executor';

export interface ConstraintExecutorClass<
  T extends ConstraintExecutor = ConstraintExecutor,
> extends ConstructorClass<T> {
  readonly type: string;
}
