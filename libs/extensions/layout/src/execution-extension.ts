import {
  BlockExecutor,
  BlockExecutorType,
  JayveeInterpreterExtension,
} from '@jayvee/execution';

import { LayoutValidatorExecutor } from './lib';

export class LayoutExecutionExtension implements JayveeInterpreterExtension {
  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return [LayoutValidatorExecutor];
  }
}
