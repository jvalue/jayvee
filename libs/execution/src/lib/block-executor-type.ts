import { BlockExecutor } from './block-executor';

export interface BlockExecutorType<T extends BlockExecutor = BlockExecutor>
  extends Function {
  new (): T;
}
