import { registerBlockExecutor } from './block-executor-registry';
import { BlockExecutorType } from './block-executor-type';

export interface JayveeExecExtension {
  getBlockExecutors(): BlockExecutorType[];
}

export function useExtension(extension: JayveeExecExtension) {
  extension.getBlockExecutors().forEach(registerBlockExecutor);
}
