// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readJvTestAssetHelper } from '@jvalue/jayvee-language-server/test';

import { interpretString } from './interpreter';
import { ExitCode } from './parsing-util';

describe('Interpreter', () => {
  const readJvTestAsset = readJvTestAssetHelper(__dirname, '../../../');

  describe('interpretString', () => {
    it('should execute a healthy model', async () => {
      const exampleFilePath = 'example/cars.jv';
      const model = readJvTestAsset(exampleFilePath);

      const exitCode = await interpretString(model, {
        debug: true,
        debugGranularity: 'peek',
        debugTarget: undefined,
        env: new Map(),
      });
      expect(exitCode).toEqual(ExitCode.SUCCESS);
    });
  });
});
