import { getStandardBlockExecutors } from '@jayvee/extensions/std';

import { LayoutValidatorExecutor } from './layout-validator-executor';
import { registerBlockExecutor } from './utils/block-executor-registry';

export function registerBlockExecutors(): void {
  registerBlockExecutor(LayoutValidatorExecutor);

  getStandardBlockExecutors().forEach(registerBlockExecutor);
}
