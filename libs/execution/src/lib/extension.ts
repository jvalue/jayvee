import { BlockExecutorClass } from './blocks/block-executor-class';
import { registerBlockExecutor } from './blocks/block-executor-registry';

export interface JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[];
}

export function useExtension(extension: JayveeExecExtension) {
  extension.getBlockExecutors().forEach(registerBlockExecutor);
}
