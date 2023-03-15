import { strict as assert } from 'assert';

import { getRegisteredBlockExecutors } from '@jvalue/execution';
import { getRegisteredBlockMetaInformation } from '@jvalue/language-server';

import { useStdExtension } from './interpreter';

describe('std extension', () => {
  useStdExtension();
  getRegisteredBlockMetaInformation().forEach((metaInf) => {
    it(`should provide a matching block executor for block type ${metaInf.type}`, () => {
      const matchingBlockExecutor = getRegisteredBlockExecutors()
        .map((blockExecutorClass) => new blockExecutorClass())
        .find((blockExecutor) => blockExecutor.blockType === metaInf.type);

      expect(matchingBlockExecutor).toBeDefined();
      assert(matchingBlockExecutor !== undefined);

      expect(matchingBlockExecutor.inputType).toEqual(metaInf.inputType);
      expect(matchingBlockExecutor.outputType).toEqual(metaInf.outputType);
    });
  });
});
