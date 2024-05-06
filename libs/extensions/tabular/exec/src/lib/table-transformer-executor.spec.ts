// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import * as R from '@jvalue/jayvee-execution';
import { getTestExecutionContext } from '@jvalue/jayvee-execution/test';
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

import {
  type ReducedColumnDefinitionEntry,
  createTableFromLocalExcelFile,
} from '../../test/util';

import { TableTransformerExecutor } from './table-transformer-executor';

describe('Validation of TableTransformerExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/table-transformer-executor/',
  );

  async function readTestExcelAllColumns() {
    return readTestTable('test-excel.xlsx', [
      {
        columnName: 'index',
        sheetColumnIndex: 0,
        valueType: services.ValueTypeProvider.Primitives.Integer,
      },
      {
        columnName: 'name',
        sheetColumnIndex: 1,
        valueType: services.ValueTypeProvider.Primitives.Text,
      },
      {
        columnName: 'flag',
        sheetColumnIndex: 2,
        valueType: services.ValueTypeProvider.Primitives.Boolean,
      },
    ]);
  }
  async function readTestTable(
    fileName: string,
    columnDefinitions: ReducedColumnDefinitionEntry[],
  ): Promise<R.Table> {
    const absoluteFileName = path.resolve(
      __dirname,
      '../../test/assets/table-transformer-executor/',
      fileName,
    );
    return await createTableFromLocalExcelFile(
      absoluteFileName,
      columnDefinitions,
    );
  }

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.Table,
  ): Promise<R.Result<R.Table>> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new TableTransformerExecutor().doExecute(
      IOInput,
      getTestExecutionContext(
        locator,
        document,
        services,
        [block],
        {
          isDebugMode: false,
          debugGranularity: 'minimal',
          debugTargets: 'all',
        },
        true,
      ),
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

  it('should diagnose no error on valid table transform', async () => {
    const text = readJvTestAsset('valid-transfomer.jv');

    const testTable = await readTestExcelAllColumns();
    const result = await parseAndExecuteExecutor(text, testTable);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TABLE);
      expect(result.right.getNumberOfColumns()).toEqual(4);
      expect(result.right.getNumberOfRows()).toEqual(6);
      expect(result.right.getColumn('index')).toEqual(
        expect.objectContaining({
          values: expect.arrayContaining([0, 1, 2, 5]) as number[],
        }),
      );
      expect(result.right.getColumn('index2')).toEqual(
        expect.objectContaining({
          values: expect.arrayContaining([0, 2, 4, 10]) as number[],
        }),
      );
    }
  });

  it('should diagnose no error on column overwrite', async () => {
    const text = readJvTestAsset('valid-column-overwrite.jv');

    const testTable = await readTestExcelAllColumns();
    const result = await parseAndExecuteExecutor(text, testTable);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TABLE);
      expect(result.right.getNumberOfColumns()).toEqual(3);
      expect(result.right.getNumberOfRows()).toEqual(6);
      expect(result.right.getColumn('index')).toEqual(
        expect.objectContaining({
          values: expect.arrayContaining([0, 2, 4, 10]) as number[],
        }),
      );
    }
  });

  it('should diagnose no error on column type change', async () => {
    const text = readJvTestAsset('valid-column-type-change.jv');

    const testTable = await readTestExcelAllColumns();
    const result = await parseAndExecuteExecutor(text, testTable);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TABLE);
      expect(result.right.getNumberOfColumns()).toEqual(3);
      expect(result.right.getNumberOfRows()).toEqual(6);
      expect(result.right.getColumn('index')).toEqual(
        expect.objectContaining({
          values: [false, true, true, true, true, true],
          valueType: services.ValueTypeProvider.Primitives.Boolean,
        }),
      );
    }
  });

  it('should diagnose no error on empty table', async () => {
    const text = readJvTestAsset('valid-transfomer.jv');

    const testTable = await readTestTable('test-empty.xlsx', [
      {
        columnName: 'index',
        sheetColumnIndex: 0,
        valueType: services.ValueTypeProvider.Primitives.Integer,
      },
    ]);
    const result = await parseAndExecuteExecutor(text, testTable);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TABLE);
      expect(result.right.getNumberOfColumns()).toEqual(2);
      expect(result.right.getNumberOfRows()).toEqual(0);
      expect(result.right.getColumn('index')?.values).toHaveLength(0);
      expect(result.right.getColumn('index2')?.values).toHaveLength(0);
    }
  });

  it('should diagnose error on missing input column', async () => {
    const text = readJvTestAsset('valid-missing-input-column.jv');

    const testTable = await readTestExcelAllColumns();
    const result = await parseAndExecuteExecutor(text, testTable);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'The specified input column "id" does not exist in the given table',
      );
    }
  });

  it('should diagnose error on transform type missmatch', async () => {
    const text = readJvTestAsset('valid-transform-type-missmatch.jv');

    const testTable = await readTestExcelAllColumns();
    const result = await parseAndExecuteExecutor(text, testTable);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'Type text of column "name" is not convertible to type integer',
      );
    }
  });
});
