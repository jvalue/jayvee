import { readJvTestAssetHelper } from '@jvalue/jayvee-language-server/test';

import { ExitCode } from './cli-util';
import { interpretString } from './interpreter';

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
