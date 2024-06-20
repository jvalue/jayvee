// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readJvTestAssetHelper } from '@jvalue/jayvee-language-server/test';

import { DefaultJayveeInterpreter } from './interpreter';
import { ExitCode } from './parsing-util';

describe('Interpreter', () => {
  const readJvTestAsset = readJvTestAssetHelper(__dirname, '../../../');

  describe('interpretString', () => {
    it('should execute a healthy model', async () => {
      const exampleFilePath = 'example/cars.jv';
      const model = readJvTestAsset(exampleFilePath);

      const interpreter = new DefaultJayveeInterpreter({
        pipelineMatcher: () => true,
        debug: true,
        debugGranularity: 'peek',
        debugTarget: 'all',
        env: new Map(),
      });
      const exitCode = await interpreter.interpretString(model);
      expect(exitCode).toEqual(ExitCode.SUCCESS);
    });
  });
});
