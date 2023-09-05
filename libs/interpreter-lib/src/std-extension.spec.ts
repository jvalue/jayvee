// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { getRegisteredBlockExecutors } from '@jvalue/jayvee-execution';
import { BlockMetaInformation } from '@jvalue/jayvee-language-server';

import { useStdExtension } from './interpreter';

describe('std extension', () => {
  useStdExtension();
  [].forEach((metaInf: BlockMetaInformation) => {
    // TODO: iterate over all block meta inf
    it(`should provide a matching block executor for block type ${metaInf.type}`, () => {
      const matchingBlockExecutorClass = getRegisteredBlockExecutors().find(
        (blockExecutorClass) => blockExecutorClass.type === metaInf.type,
      );

      expect(matchingBlockExecutorClass).toBeDefined();
      assert(matchingBlockExecutorClass !== undefined);

      const matchingBlockExecutor = new matchingBlockExecutorClass();

      expect(matchingBlockExecutor.inputType).toEqual(metaInf.inputType);
      expect(matchingBlockExecutor.outputType).toEqual(metaInf.outputType);
    });
  });
});
