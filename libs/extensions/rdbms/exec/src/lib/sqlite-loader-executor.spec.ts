// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import * as R from '@jvalue/jayvee-execution';
import {
  constructTable,
  getTestExecutionContext,
} from '@jvalue/jayvee-execution/test';
import {
  type BlockDefinition,
  IOType,
  type JayveeServices,
  createJayveeServices,
} from '@jvalue/jayvee-language-server';
import {
  type ParseHelperOptions,
  expectNoParserAndLexerErrors,
  loadTestExtensions,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import {
  type AstNode,
  type AstNodeLocator,
  type LangiumDocument,
} from 'langium';
import { NodeFileSystem } from 'langium/node';
import type * as sqlite3 from 'sqlite3';
import { type Mock, vi } from 'vitest';

import { SQLiteLoaderExecutor } from './sqlite-loader-executor';

type SqliteRunCallbackType = (
  result: sqlite3.RunResult,
  err: Error | null,
) => void;
// eslint-disable-next-line no-var
var databaseMock: Mock;
// eslint-disable-next-line no-var
var databaseRunMock: Mock;
// eslint-disable-next-line no-var
var databaseCloseMock: Mock;
vi.mock('sqlite3', () => {
  databaseMock = vi.fn();
  databaseRunMock = vi.fn();
  databaseCloseMock = vi.fn();
  return {
    default: {
      Database: databaseMock,
    },
  };
});
function mockDatabaseDefault() {
  const mockDB = {
    close: databaseCloseMock,
    run: databaseRunMock,
  };
  databaseMock.mockImplementation(() => {
    return mockDB;
  });
}

describe('Validation of SQLiteLoaderExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/sqlite-loader-executor/',
  );

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.Table,
  ): Promise<R.Result<R.None>> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new SQLiteLoaderExecutor().doExecute(
      IOInput,
      getTestExecutionContext(locator, document, services, [block]),
    );
  }

  beforeAll(async () => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    await loadTestExtensions(services, [
      path.resolve(__dirname, '../../test/test-extension/TestBlockTypes.jv'),
    ]);
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should diagnose no error on valid loader config', async () => {
    mockDatabaseDefault();
    databaseRunMock.mockImplementation(
      (sql: string, callback: SqliteRunCallbackType) => {
        callback(
          {
            lastID: 0,
            changes: 0,
          } as sqlite3.RunResult,
          null,
        );
        return this;
      },
    );
    const text = readJvTestAsset('valid-sqlite-loader.jv');

    const inputTable = constructTable(
      [
        {
          columnName: 'Column1',
          column: {
            values: ['value 1'],
            valueType: services.ValueTypeProvider.Primitives.Text,
          },
        },
        {
          columnName: 'Column2',
          column: {
            values: [20.2],
            valueType: services.ValueTypeProvider.Primitives.Decimal,
          },
        },
      ],
      1,
    );
    const result = await parseAndExecuteExecutor(text, inputTable);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.NONE);
      expect(databaseRunMock).toBeCalledTimes(3);
      expect(databaseRunMock).nthCalledWith(
        1,
        'DROP TABLE IF EXISTS "Test";',
        expect.any(Function),
      );
      expect(databaseRunMock).nthCalledWith(
        2,
        `CREATE TABLE IF NOT EXISTS "Test" ("Column1" text,"Column2" real);`,
        expect.any(Function),
      );
      expect(databaseRunMock).nthCalledWith(
        3,
        `INSERT INTO "Test" ("Column1","Column2") VALUES ('value 1',20.2)`,
        expect.any(Function),
      );
      expect(databaseCloseMock).toBeCalledTimes(1);
    }
  });

  it('should diagnose error on sqlite database open error', async () => {
    databaseMock.mockImplementation(() => {
      throw new Error('File not found');
    });
    const text = readJvTestAsset('valid-sqlite-loader.jv');

    const inputTable = constructTable(
      [
        {
          columnName: 'Column1',
          column: {
            values: ['value 1'],
            valueType: services.ValueTypeProvider.Primitives.Text,
          },
        },
        {
          columnName: 'Column2',
          column: {
            values: [20.2],
            valueType: services.ValueTypeProvider.Primitives.Decimal,
          },
        },
      ],
      1,
    );
    const result = await parseAndExecuteExecutor(text, inputTable);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'Could not write to sqlite database: File not found',
      );
      expect(databaseRunMock).toBeCalledTimes(0);
      expect(databaseCloseMock).toBeCalledTimes(0);
    }
  });
});
