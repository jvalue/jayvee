import { ConstructorClass } from '@jvalue/language-server';

import { BlockExecutor } from './block-executor';

export interface BlockExecutorClass<T extends BlockExecutor = BlockExecutor>
  extends ConstructorClass<T> {
  readonly type: string;
}
