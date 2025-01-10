// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type JayveeModel } from '@jvalue/jayvee-language-server';
import { readJvTestAssetHelper } from '@jvalue/jayvee-language-server/test';

import { DefaultJayveeInterpreter } from './interpreter';
import { ExitCode, extractAstNodeFromString } from './parsing-util';

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

  describe('hooks', () => {
    it('should execute a general hook on every block', async () => {
      const exampleFilePath = 'example/cars.jv';
      const model = readJvTestAsset(exampleFilePath);

      const interpreter = new DefaultJayveeInterpreter({
        pipelineMatcher: () => true,
        debug: true,
        debugGranularity: 'peek',
        debugTarget: 'all',
        env: new Map(),
      });

      const program = await interpreter.parseModel(
        async (services, loggerFactory) =>
          await extractAstNodeFromString<JayveeModel>(
            model,
            services,
            loggerFactory.createLogger(),
          ),
      );
      expect(program).toBeDefined();
      assert(program !== undefined);

      const spy = vi
        .fn<unknown[], Promise<undefined>>()
        .mockResolvedValue(undefined);

      program.addHook(
        async () => {
          return spy();
        },
        { position: 'before', blocking: true },
      );

      const exitCode = await interpreter.interpretProgram(program);
      expect(exitCode).toEqual(ExitCode.SUCCESS);

      expect(spy).toHaveBeenCalledTimes(6);
    });

    it('should not wait for non-blocking hooks', async () => {
      const exampleFilePath = 'example/cars.jv';
      const model = readJvTestAsset(exampleFilePath);

      const interpreter = new DefaultJayveeInterpreter({
        pipelineMatcher: () => true,
        debug: true,
        debugGranularity: 'peek',
        debugTarget: 'all',
        env: new Map(),
      });

      const program = await interpreter.parseModel(
        async (services, loggerFactory) =>
          await extractAstNodeFromString<JayveeModel>(
            model,
            services,
            loggerFactory.createLogger(),
          ),
      );
      expect(program).toBeDefined();
      assert(program !== undefined);

      program.addHook(
        () => {
          return new Promise((resolve) => {
            setTimeout(resolve, 30000);
          });
        },
        { position: 'before', blocking: false },
      );

      const exitCode = await interpreter.interpretProgram(program);
      expect(exitCode).toEqual(ExitCode.SUCCESS);
    }, 10000);
  });
});
