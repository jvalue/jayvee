import { registerBlockExecutor, useExtension } from '@jayvee/execution';
import { StdExtension } from '@jayvee/extensions/std';

import { LayoutValidatorExecutor } from './layout-validator-executor';

export function registerBlockExecutors(): void {
  useExtension(new StdExtension());

  registerBlockExecutor(LayoutValidatorExecutor); // TODO: move to extension
}
