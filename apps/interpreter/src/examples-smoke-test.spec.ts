// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import { processExitMockImplementation } from '@jvalue/jayvee-execution/test';
import {
  PostgresLoaderExecutorMock,
  SQLiteLoaderExecutorMock,
} from '@jvalue/jayvee-extensions/rdbms/test';
import { HttpExtractorExecutorMock } from '@jvalue/jayvee-extensions/std/test';
import {
  createJayveeServices,
  initializeWorkspace,
} from '@jvalue/jayvee-language-server';
import { NodeFileSystem } from 'langium/node';
import nock from 'nock';
import { type MockInstance, vi } from 'vitest';

import { runAction } from './run-action';

// Mock global imports
vi.mock('pg', () => {
  const mClient = {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  };
  return {
    default: {
      Client: vi.fn(() => mClient),
    },
  };
});
vi.mock('sqlite3', () => {
  const mockDB = {
    close: vi.fn(),
    run: vi.fn(),
  };
  return {
    default: { Database: vi.fn(() => mockDB) },
  };
});

describe('jv example smoke tests', () => {
  const baseDir = path.resolve(__dirname, '../../../example/');

  const defaultOptions = {
    env: new Map<string, string>(),
    debug: false,
    debugGranularity: 'minimal',
    debugTarget: undefined,
  };

  let exitSpy: MockInstance;
  let httpExtractorMock: HttpExtractorExecutorMock;
  let postgresLoaderMock: PostgresLoaderExecutorMock;
  let sqliteLoaderMock: SQLiteLoaderExecutorMock;

  beforeAll(async () => {
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    await initializeWorkspace(services);

    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(processExitMockImplementation);
    httpExtractorMock = new HttpExtractorExecutorMock();
    postgresLoaderMock = new PostgresLoaderExecutorMock();
    sqliteLoaderMock = new SQLiteLoaderExecutorMock();
  });

  afterEach(() => {
    exitSpy.mockClear();
    httpExtractorMock.restore();
    postgresLoaderMock.restore();
    sqliteLoaderMock.restore();
  });

  it('should have no errors when executing cars.jv example', async () => {
    // Prepare mocks
    httpExtractorMock.setup(() => {
      return [
        nock('https://gist.githubusercontent.com')
          .get(
            '/noamross/e5d3e859aa0c794be10b/raw/b999fb4425b54c63cab088c0ce2c0d6ce961a563/cars.csv',
          )
          .replyWithFile(
            200,
            path.resolve(__dirname, '../test/assets/cars.csv'),
            {
              'Content-Type': 'text/csv',
            },
          ),
      ];
    });
    sqliteLoaderMock.setup();

    await runAction(path.resolve(baseDir, 'cars.jv'), {
      ...defaultOptions,
    });

    expect(httpExtractorMock.nockScopes.every((scope) => scope.isDone()));
    expect(sqliteLoaderMock.sqliteClient.run).toBeCalledTimes(3);
    expect(sqliteLoaderMock.sqliteClient.close).toBeCalledTimes(1);

    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should have no errors when executing electric-vehicles.jv example', async () => {
    // Prepare mocks
    httpExtractorMock.setup(() => {
      return [
        nock('https://data.wa.gov')
          .get('/api/views/f6w7-q2d2/rows.csv?accessType=DOWNLOAD')
          .replyWithFile(
            200,
            path.resolve(
              __dirname,
              '../test/assets/Electric_Vehicle_Test_Data.csv',
            ),
            {
              'Content-Type': 'text/csv',
            },
          ),
      ];
    });
    postgresLoaderMock.setup();
    sqliteLoaderMock.setup();

    await runAction(path.resolve(baseDir, 'electric-vehicles.jv'), {
      ...defaultOptions,
      env: new Map<string, string>([
        ['DB_HOST', 'mock'],
        ['DB_DATABASE', 'mock'],
        ['DB_PASSWORD', 'mock'],
        ['DB_USERNAME', 'mock'],
        ['DB_PORT', '5432'],
      ]),
    });

    expect(httpExtractorMock.nockScopes.every((scope) => scope.isDone()));
    expect(postgresLoaderMock.pgClient.connect).toBeCalledTimes(1);
    expect(postgresLoaderMock.pgClient.query).toBeCalledTimes(3);
    expect(postgresLoaderMock.pgClient.end).toBeCalledTimes(1);
    expect(sqliteLoaderMock.sqliteClient.run).toBeCalledTimes(3);
    expect(sqliteLoaderMock.sqliteClient.close).toBeCalledTimes(1);

    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should have no errors when executing gtfs-rt.jv example', async () => {
    // Prepare mocks
    httpExtractorMock.setup(() => {
      return [
        nock('https://proxy.transport.data.gouv.fr')
          .get('/resource/bibus-brest-gtfs-rt-trip-update')
          .replyWithFile(
            200,
            path.resolve(
              __dirname,
              '../test/assets/bibus-brest-gtfs-rt-trip-update',
            ),
            {
              'Content-Type': 'application/octet-stream',
            },
          )
          .get('/resource/bibus-brest-gtfs-rt-vehicle-position')
          .replyWithFile(
            200,
            path.resolve(
              __dirname,
              '../test/assets/bibus-brest-gtfs-rt-vehicle-position',
            ),
            {
              'Content-Type': 'application/octet-stream',
            },
          )
          .get('/resource/bibus-brest-gtfs-rt-alerts')
          .replyWithFile(
            200,
            path.resolve(
              __dirname,
              '../test/assets/bibus-brest-gtfs-rt-alerts.json',
            ),
            {
              'Content-Type': 'application/json',
            },
          ),
      ];
    });
    sqliteLoaderMock.setup();

    await runAction(path.resolve(baseDir, 'gtfs-rt.jv'), {
      ...defaultOptions,
    });

    expect(httpExtractorMock.nockScopes.every((scope) => scope.isDone()));
    expect(sqliteLoaderMock.sqliteClient.run).toBeCalledTimes(6);
    expect(sqliteLoaderMock.sqliteClient.close).toBeCalledTimes(3);

    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should have no errors when executing gtfs-static.jv example', async () => {
    // Prepare mocks
    httpExtractorMock.setup(() => {
      return [
        nock('https://developers.google.com')
          .get('/static/transit/gtfs/examples/sample-feed.zip')
          .replyWithFile(
            200,
            path.resolve(__dirname, '../test/assets/sample-feed.zip'),
            {
              'Content-Type': 'application/zip',
            },
          ),
      ];
    });
    sqliteLoaderMock.setup();

    await runAction(path.resolve(baseDir, 'gtfs-static.jv'), {
      ...defaultOptions,
    });

    expect(httpExtractorMock.nockScopes.every((scope) => scope.isDone()));
    expect(sqliteLoaderMock.sqliteClient.run).toBeCalledTimes(33);
    expect(sqliteLoaderMock.sqliteClient.close).toBeCalledTimes(11);

    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
