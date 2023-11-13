// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import {
  constructTable,
  getTestExecutionContext,
} from '@jvalue/jayvee-execution/test';
import {
  BlockDefinition,
  IOType,
  PrimitiveValuetypes,
  createJayveeServices,
} from '@jvalue/jayvee-language-server';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  loadTestExtensions,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { Client } from 'pg';

import { PostgresLoaderExecutor } from './postgres-loader-executor';

jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

describe('Validation of PostgresLoaderExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let pgClient: jest.Mocked<Client>;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/postgres-loader-executor/',
  );

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.Table,
  ): Promise<R.Result<R.None>> {
    const document = await parse(input, { validationChecks: 'all' });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new PostgresLoaderExecutor().doExecute(
      IOInput,
      getTestExecutionContext(locator, document, [block]),
    );
  }

  beforeAll(async () => {
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    await loadTestExtensions(services, [
      path.resolve(__dirname, '../../test/test-extension/TestBlockTypes.jv'),
    ]);
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });
  beforeEach(() => {
    pgClient = new Client() as jest.Mocked<Client>;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should diagnose no error on valid loader config', async () => {
    const text = readJvTestAsset('valid-postgres-loader.jv');

    const inputTable = constructTable(
      [
        {
          columnName: 'Column1',
          column: {
            values: ['value 1'],
            valuetype: PrimitiveValuetypes.Text,
          },
        },
        {
          columnName: 'Column2',
          column: {
            values: [20.2],
            valuetype: PrimitiveValuetypes.Decimal,
          },
        },
      ],
      1,
    );
    const result = await parseAndExecuteExecutor(text, inputTable);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.NONE);
      expect(pgClient.connect).toBeCalledTimes(1);
      expect(pgClient.query).nthCalledWith(1, 'DROP TABLE IF EXISTS "Test";');
      expect(pgClient.query).nthCalledWith(
        2,
        `CREATE TABLE IF NOT EXISTS "Test" ("Column1" text,"Column2" real);`,
      );
      expect(pgClient.query).nthCalledWith(
        3,
        `INSERT INTO "Test" ("Column1","Column2") VALUES ('value 1',20.2)`,
      );
      expect(pgClient.end).toBeCalledTimes(1);
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
            valuetype: PrimitiveValuetypes.Text,
          },
        },
        {
          columnName: 'Column2',
          column: {
            values: [20.2],
            valuetype: PrimitiveValuetypes.Decimal,
          },
        },
      ],
      1,
    );
    pgClient.connect.mockImplementation(() => {
      throw new Error('Connection error');
    });
    const result = await parseAndExecuteExecutor(text, inputTable);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'Could not write to postgres database: Connection error',
      );
      expect(pgClient.connect).toBeCalledTimes(1);
      expect(pgClient.query).toBeCalledTimes(0);
      expect(pgClient.end).toBeCalledTimes(1);
    }
  });
});
