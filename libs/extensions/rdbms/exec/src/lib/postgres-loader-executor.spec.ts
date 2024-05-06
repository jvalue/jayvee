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
import { type Mock, vi } from 'vitest';

import { PostgresLoaderExecutor } from './postgres-loader-executor';

// eslint-disable-next-line no-var
var databaseConnectMock: Mock;
// eslint-disable-next-line no-var
var databaseQueryMock: Mock;
// eslint-disable-next-line no-var
var databaseEndMock: Mock;
vi.mock('pg', () => {
  databaseConnectMock = vi.fn();
  databaseQueryMock = vi.fn();
  databaseEndMock = vi.fn();
  const mClient = {
    connect: databaseConnectMock,
    query: databaseQueryMock,
    end: databaseEndMock,
  };
  return {
    default: {
      Client: vi.fn(() => mClient),
    },
  };
});

describe('Validation of PostgresLoaderExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/postgres-loader-executor/',
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

    return new PostgresLoaderExecutor().doExecute(
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
    const text = readJvTestAsset('valid-postgres-loader.jv');

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
      expect(databaseConnectMock).toBeCalledTimes(1);
      expect(databaseQueryMock).nthCalledWith(
        1,
        'DROP TABLE IF EXISTS "Test";',
      );
      expect(databaseQueryMock).nthCalledWith(
        2,
        `CREATE TABLE IF NOT EXISTS "Test" ("Column1" text,"Column2" real);`,
      );
      expect(databaseQueryMock).nthCalledWith(
        3,
        `INSERT INTO "Test" ("Column1","Column2") VALUES ('value 1',20.2)`,
      );
      expect(databaseEndMock).toBeCalledTimes(1);
    }
  });

  it('should diagnose error on pg client connect error', async () => {
    const text = readJvTestAsset('valid-postgres-loader.jv');

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
    databaseConnectMock.mockImplementation(() => {
      throw new Error('Connection error');
    });
    const result = await parseAndExecuteExecutor(text, inputTable);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'Could not write to postgres database: Connection error',
      );
      expect(databaseConnectMock).toBeCalledTimes(1);
      expect(databaseQueryMock).toBeCalledTimes(0);
      expect(databaseEndMock).toBeCalledTimes(1);
    }
  });
});
