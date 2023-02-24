import { strict as assert } from 'assert';

import { getRegisteredBlockExecutors } from '@jayvee/execution';
import { getRegisteredMetaInformation } from '@jayvee/language-server';

import { useStdExtension } from './interpreter';

describe('std extension', () => {
  useStdExtension();
  getRegisteredMetaInformation().forEach((metaInf) => {
    it(`should provide a matching block executor for block type ${metaInf.blockType}`, () => {
      const matchingBlockExecutor = getRegisteredBlockExecutors()
        .map((blockExecutorClass) => new blockExecutorClass())
        .find((blockExecutor) => blockExecutor.blockType === metaInf.blockType);

      expect(matchingBlockExecutor).toBeDefined();
      assert(matchingBlockExecutor !== undefined);

      expect(matchingBlockExecutor.inputType).toEqual(metaInf.inputType);
      expect(matchingBlockExecutor.outputType).toEqual(metaInf.outputType);
    });
  });
});
