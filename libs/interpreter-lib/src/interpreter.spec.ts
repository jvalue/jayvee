// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { Table, isOk } from '@jvalue/jayvee-execution';
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
        async ({ blocktype }) => {
          return sqlite_spy(blocktype);
        },
        { blocking: true, blocktypes: ['SQLiteLoader'] },
      );

      const interpreter_spy = vi
        .fn<unknown[], Promise<undefined>>()
        .mockResolvedValue(undefined);

      program.addHook(
        'postBlock',
        async ({ blocktype }) => {
          return interpreter_spy(blocktype);
        },
        { blocking: true, blocktypes: ['CSVFileInterpreter'] },
      );

      const exitCode = await interpreter.interpretProgram(program);
      expect(exitCode).toEqual(ExitCode.SUCCESS);

      expect(sqlite_spy).toHaveBeenCalledTimes(1);
      expect(sqlite_spy).toHaveBeenCalledWith('SQLiteLoader');
      expect(interpreter_spy).toHaveBeenCalledTimes(1);
      expect(interpreter_spy).toHaveBeenCalledWith('CSVFileInterpreter');
    });

    it('should be called with the correct parameters', async () => {
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

      const parameter_spy = vi
        .fn<unknown[], Promise<undefined>>()
        .mockResolvedValue(undefined);

      const EXPECTED_NAMES = [
        'Mazda RX4',
        'Mazda RX4 Wag',
        'Datsun 710',
        'Hornet 4 Drive',
        'Hornet Sportabout',
        'Valiant',
        'Duster 360',
        'Merc 240D',
        'Merc 230',
        'Merc 280',
        'Merc 280C',
        'Merc 450SE',
        'Merc 450SL',
        'Merc 450SLC',
        'Cadillac Fleetwood',
        'Lincoln Continental',
        'Chrysler Imperial',
        'Fiat 128',
        'Honda Civic',
        'Toyota Corolla',
        'Toyota Corona',
        'Dodge Challenger',
        'AMC Javelin',
        'Camaro Z28',
        'Pontiac Firebird',
        'Fiat X1-9',
        'Porsche 914-2',
        'Lotus Europa',
        'Ford Pantera L',
        'Ferrari Dino',
        'Maserati Bora',
        'Volvo 142E',
      ];

      program.addHook(
        'postBlock',
        async ({ blocktype, input, output }) => {
          expect(blocktype).toBe('TableTransformer');

          expect(input).not.toBeNull();
          assert(input != null);
          assert(input instanceof Table);

          expect(input.getNumberOfColumns()).toBe(1);
          expect(input.getColumn('name')?.values).toStrictEqual(EXPECTED_NAMES);

          expect(isOk(output)).toBe(true);
          assert(isOk(output));
          const out = output.right;
          expect(out).not.toBeNull();
          assert(out != null);
          assert(out instanceof Table);

          expect(out.getNumberOfColumns()).toBe(2);
          expect(out.getColumn('name')?.values).toStrictEqual(EXPECTED_NAMES);
          expect(out.getColumn('nameCopy')?.values).toStrictEqual(
            EXPECTED_NAMES,
          );

          return parameter_spy();
        },
        { blocking: true, blocktypes: ['TableTransformer'] },
      );

      const exitCode = await interpreter.interpretProgram(program);
      expect(exitCode).toEqual(ExitCode.SUCCESS);

      expect(parameter_spy).toHaveBeenCalledTimes(1);
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

  describe('graphProgram', () => {
    it('should graph the cars example', async () => {
      const exampleFilePath = 'example/cars.jv';
      const model = readJvTestAsset(exampleFilePath);

      const interpreter = new DefaultJayveeInterpreter({
        pipelineMatcher: () => true,
        debug: true,
        debugGranularity: 'peek',
        debugTarget: 'all',
        env: new Map(),
      });

      const program = await interpreter.parseModel((services, loggerFactory) =>
        extractAstNodeFromString<JayveeModel>(
          model,
          services,
          loggerFactory.createLogger(),
        ),
      );
      expect(program).toBeDefined();
      assert(program !== undefined);

      const graph = interpreter.graphProgram(program);
      expect(graph).not.toBe('No pipelines to graph');
      assert(graph !== 'No pipelines to graph');

      expect(graph.toString()).toBe(`---
title: CarsPipeline
---
flowchart TB
\tb[CarsExtractor]
\tc[CarsTextFileInterpreter]
\te[CarsCSVInterpreter]
\tg[NameHeaderWriter]
\ti[CarsTableInterpreter]
\tk[CarsLoader]

\tb d@-->|File| c
\tc f@-->|TextFile| e
\te h@-->|Sheet| g
\tg j@-->|Sheet| i
\ti l@-->|Table| k`);
    });
    it('should graph the composite-blocks example', async () => {
      const assetPath =
        'libs/interpreter-lib/test/assets/graph/composite-block.jv';
      const model = readJvTestAsset(assetPath);

      const interpreter = new DefaultJayveeInterpreter({
        pipelineMatcher: () => true,
        debug: true,
        debugGranularity: 'peek',
        debugTarget: 'all',
        env: new Map(),
      });

      const program = await interpreter.parseModel((services, loggerFactory) =>
        extractAstNodeFromString<JayveeModel>(
          model,
          services,
          loggerFactory.createLogger(),
        ),
      );
      expect(program).toBeDefined();
      assert(program !== undefined);

      const graph = interpreter.graphProgram(program);
      expect(graph).not.toBe('No pipelines to graph');
      assert(graph !== 'No pipelines to graph');

      expect(graph.toString()).toBe(`---
title: CarsPipeline
---
flowchart TB
\tt[CarsTableInterpreter]
\tv[CarsTableTransformer]
\tx[CarsLoader]

\tn u@-->|Sheet| t
\tt w@-->|Table| v
\tv y@-->|Table| x

\tsubgraph n [CSVExtractor]
\t\tdirection TB
\t\to[FileExtractor]
\t\tp[FileTextInterpreter]
\t\tr[FileCSVInterpreter]

\t\to q@-->|File| p
\t\tp s@-->|TextFile| r
\tend`);
    });
    it('should graph models with two contained pipelines', async () => {
      const assetPath =
        'libs/interpreter-lib/test/assets/graph/two-pipelines.jv';
      const model = readJvTestAsset(assetPath);

      const interpreter = new DefaultJayveeInterpreter({
        pipelineMatcher: () => true,
        debug: true,
        debugGranularity: 'peek',
        debugTarget: 'all',
        env: new Map(),
      });

      const program = await interpreter.parseModel((services, loggerFactory) =>
        extractAstNodeFromString<JayveeModel>(
          model,
          services,
          loggerFactory.createLogger(),
        ),
      );
      expect(program).toBeDefined();
      assert(program !== undefined);

      const graph = interpreter.graphProgram(program);
      expect(graph).not.toBe('No pipelines to graph');
      assert(graph !== 'No pipelines to graph');

      expect(graph.toString()).toBe(`---
---
flowchart TB
\tsubgraph ba [CarsPipeline]
\t\tdirection TB
\t\tbb[CarsExtractor]
\t\tbc[CarsTextFileInterpreter]
\t\tbe[CarsCSVInterpreter]
\t\tbg[NameHeaderWriter]
\t\tbi[CarsTableInterpreter]
\t\tbk[CarsLoader]

\t\tbb bd@-->|File| bc
\t\tbc bf@-->|TextFile| be
\t\tbe bh@-->|Sheet| bg
\t\tbg bj@-->|Sheet| bi
\t\tbi bl@-->|Table| bk
\tend
\tsubgraph bm [ElectricVehiclesPipeline]
\t\tdirection TB
\t\tbn[ElectricVehiclesHttpExtractor]
\t\tbo[ElectricVehiclesTextFileInterpreter]
\t\tbq[ElectricVehiclesCSVInterpreter]
\t\tbs[ElectricVehiclesTableInterpreter]
\t\tbu[ElectricRangeTransformer]
\t\tbw[ElectricVehiclesSQLiteLoader]

\t\tbn bp@-->|File| bo
\t\tbo br@-->|TextFile| bq
\t\tbq bt@-->|Sheet| bs
\t\tbs bv@-->|Table| bu
\t\tbu bx@-->|Table| bw
\tend`);
    });
  });
});
