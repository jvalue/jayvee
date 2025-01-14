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
        'preBlock',
        async () => {
          return spy();
        },
        { blocking: true },
      );

      const exitCode = await interpreter.interpretProgram(program);
      expect(exitCode).toEqual(ExitCode.SUCCESS);

      expect(spy).toHaveBeenCalledTimes(6);
    });

    it('should execute a block specific hook only on that blocktype', async () => {
      const exampleFilePath =
        'libs/interpreter-lib/test/assets/hooks/valid-builtin-and-composite-blocks.jv';
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

      const sqlite_spy = vi
        .fn<unknown[], Promise<undefined>>()
        .mockResolvedValue(undefined);

      program.addHook(
        'preBlock',
        async (blocktype) => {
          return sqlite_spy(blocktype);
        },
        { blocking: true, blocktypes: 'SQLiteLoader' },
      );

      const interpreter_spy = vi
        .fn<unknown[], Promise<undefined>>()
        .mockResolvedValue(undefined);

      program.addHook(
        'postBlock',
        async (blocktype) => {
          return interpreter_spy(blocktype);
        },
        { blocking: true, blocktypes: 'CSVFileInterpreter' },
      );

      const exitCode = await interpreter.interpretProgram(program);
      expect(exitCode).toEqual(ExitCode.SUCCESS);

      expect(sqlite_spy).toHaveBeenCalledTimes(1);
      expect(sqlite_spy).toHaveBeenCalledWith('SQLiteLoader');
      expect(interpreter_spy).toHaveBeenCalledTimes(1);
      expect(interpreter_spy).toHaveBeenCalledWith('CSVFileInterpreter');
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
        'postBlock',
        (): Promise<void> => {
          return new Promise((resolve) => {
            setTimeout(resolve, 30000);
          });
        },
        { blocking: false },
      );

      const exitCode = await interpreter.interpretProgram(program);
      expect(exitCode).toEqual(ExitCode.SUCCESS);
    }, 10000);
  });
});
