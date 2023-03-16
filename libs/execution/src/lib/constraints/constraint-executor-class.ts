import { ConstraintExecutor } from './constraint-executor';

export interface ConstraintExecutorClass<
  T extends ConstraintExecutor = ConstraintExecutor,
> extends Function {
  new (): T;
}
