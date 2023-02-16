import { BlockExecutorClass } from './block-executor-class';
import { registerBlockExecutor } from './block-executor-registry';

export interface JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[];
}

export function useExtension(extension: JayveeExecExtension) {
  extension.getBlockExecutors().forEach(registerBlockExecutor);
}
