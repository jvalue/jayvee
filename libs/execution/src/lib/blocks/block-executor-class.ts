import { BlockExecutor } from './block-executor';

export interface BlockExecutorClass<T extends BlockExecutor = BlockExecutor>
  extends Function {
  new (): T;
}
