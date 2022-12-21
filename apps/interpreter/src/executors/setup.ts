import { useExtension } from '@jayvee/execution';
import { StdExtension } from '@jayvee/extensions/std';

export function registerBlockExecutors(): void {
  useExtension(new StdExtension());
}
