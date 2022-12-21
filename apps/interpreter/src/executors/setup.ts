import { useExtension } from '@jayvee/execution';
import { StdExecutionExtension } from '@jayvee/extensions/std';

export function registerBlockExecutors(): void {
  useExtension(new StdExecutionExtension());
}
