import { registerBlockExecutor } from './block-executor-registry';
import { BlockExecutorType } from './block-executor-type';

export interface JayveeInterpreterExtension {
  getBlockExecutors(): BlockExecutorType[];
}

export function useExtension(extension: JayveeInterpreterExtension) {
  extension.getBlockExecutors().forEach(registerBlockExecutor);
}
