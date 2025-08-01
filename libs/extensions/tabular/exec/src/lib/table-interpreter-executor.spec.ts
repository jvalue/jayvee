// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import * as R from '@jvalue/jayvee-execution';
import { getTestExecutionContext } from '@jvalue/jayvee-execution/test';
import {
  type BlockDefinition,
  IOType,
  InvalidError,
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

import { createWorkbookFromLocalExcelFile } from '../../test/util';

import { TableInterpreterExecutor } from './table-interpreter-executor';

describe('Validation of TableInterpreterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/table-interpreter-executor/',
  );

  async function readTestWorkbook(fileName: string): Promise<R.Workbook> {
    const absoluteFileName = path.resolve(
      __dirname,
      '../../test/assets/table-interpreter-executor/',
      fileName,
    );
    return await createWorkbookFromLocalExcelFile(absoluteFileName);
  }

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.Sheet,
  ): Promise<R.Result<R.Table>> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new TableInterpreterExecutor().doExecute(
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

  describe('validation of sheet with header', () => {
    it('should diagnose no error on valid sheet', async () => {
      const text = readJvTestAsset('valid-with-header.jv');

      const testWorkbook = await readTestWorkbook('test-with-header.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(3);
        expect(result.right.getNumberOfRows()).toEqual(16);
        expect(result.right.getColumn('index')).toEqual(
          expect.objectContaining({
            values: expect.arrayContaining([0, 1, 2, 15]) as number[],
          }),
        );
        expect(result.right.getColumn('name')).toEqual(
          expect.objectContaining({
            values: expect.arrayContaining(['Test']) as string[],
          }),
        );
        expect(result.right.getColumn('flag')).toEqual(
          expect.objectContaining({
            values: expect.arrayContaining([true, false]) as boolean[],
          }),
        );
      }
    });

    it('should diagnose empty table on empty column parameter', async () => {
      const text = readJvTestAsset('valid-empty-columns-with-header.jv');

      const testWorkbook = await readTestWorkbook('test-with-header.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(0);
        expect(result.right.getNumberOfRows()).toEqual(0);
      }
    });

    it('should diagnose empty table on wrong header case', async () => {
      const text = readJvTestAsset('valid-with-capitalized-header.jv');

      const testWorkbook = await readTestWorkbook('test-with-header.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(0);
        expect(result.right.getNumberOfRows()).toEqual(0);
      }
    });

    it('should diagnose error on empty sheet', async () => {
      const text = readJvTestAsset('valid-with-header.jv');

      const testWorkbook = await readTestWorkbook('test-empty.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isOk(result)).toEqual(false);
      if (R.isErr(result)) {
        expect(result.left.message).toEqual(
          'The input sheet is empty and thus has no header',
        );
      }
    });

    it('should diagnose InvalidError on wrong cell value type', async () => {
      const text = readJvTestAsset('valid-wrong-value-type-with-header.jv');

      const testWorkbook = await readTestWorkbook('test-with-header.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(3);
        expect(result.right.getNumberOfRows()).toEqual(16);
        const flagColumn = result.right.getColumn('flag');
        expect(flagColumn).toBeDefined();
        assert(flagColumn !== undefined);
        for (const cell of flagColumn.values) {
          expect(cell).toBeInstanceOf(InvalidError);
        }
      }
    });
  });

  describe('validation of sheet without header', () => {
    it('should diagnose no error on valid sheet', async () => {
      const text = readJvTestAsset('valid-without-header.jv');

      const testWorkbook = await readTestWorkbook('test-without-header.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(3);
        expect(result.right.getNumberOfRows()).toEqual(16);
        expect(result.right.getColumn('index')).toEqual(
          expect.objectContaining({
            values: expect.arrayContaining([0, 1, 2, 15]) as number[],
          }),
        );
        expect(result.right.getColumn('name')).toEqual(
          expect.objectContaining({
            values: expect.arrayContaining(['Test']) as string[],
          }),
        );
        expect(result.right.getColumn('flag')).toEqual(
          expect.objectContaining({
            values: expect.arrayContaining([true, false]) as boolean[],
          }),
        );
      }
    });

    it('should diagnose no error on valid sheet with header', async () => {
      const text = readJvTestAsset('valid-without-header.jv');

      const testWorkbook = await readTestWorkbook('test-with-header.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(3);
        expect(result.right.getNumberOfRows()).toEqual(17);
        expect(result.right.getColumn('index')).toEqual(
          expect.objectContaining({
            values: expect.arrayContaining([0, 1, 2, 15]) as number[],
          }),
        );
        expect(result.right.getColumn('name')).toEqual(
          expect.objectContaining({
            values: expect.arrayContaining(['Test']) as string[],
          }),
        );
        expect(result.right.getColumn('flag')).toEqual(
          expect.objectContaining({
            values: expect.arrayContaining([true, false]) as boolean[],
          }),
        );
        for (const value of result.right.getRow(0).values()) {
          if (value === 'name') {
            continue;
          }
          expect(value).toBeInstanceOf(InvalidError);
        }
      }
    });

    it('should diagnose empty table on empty column parameter', async () => {
      const text = readJvTestAsset('valid-empty-columns-without-header.jv');

      const testWorkbook = await readTestWorkbook('test-without-header.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(0);
        expect(result.right.getNumberOfRows()).toEqual(0);
      }
    });

    it('should diagnose error on empty sheet', async () => {
      const text = readJvTestAsset('valid-without-header.jv');

      const testWorkbook = await readTestWorkbook('test-empty.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isOk(result)).toEqual(false);
      if (R.isErr(result)) {
        expect(result.left.message).toEqual(
          'There are 3 column definitions but the input sheet only has 0 columns',
        );
      }
    });

    it('should insert InvalidError on wrong cell value type', async () => {
      const text = readJvTestAsset('valid-wrong-value-type-without-header.jv');

      const testWorkbook = await readTestWorkbook('test-without-header.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(3);
        expect(result.right.getNumberOfRows()).toEqual(16);
        const flagColumn = result.right.getColumn('flag');
        expect(flagColumn).toBeDefined();
        assert(flagColumn !== undefined);
        for (const cell of flagColumn.values) {
          expect(cell).toBeInstanceOf(InvalidError);
        }
      }
    });

    it('should skip leading and trailing whitespace on numeric columns but not text columns', async () => {
      const text = readJvTestAsset('valid-without-header.jv');

      const testWorkbook = await readTestWorkbook('test-with-whitespace.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      assert(R.isOk(result));

      expect(result.right.ioType).toEqual(IOType.TABLE);
      expect(result.right.getNumberOfColumns()).toEqual(3);
      expect(result.right.getNumberOfRows()).toEqual(3);

      expect([...result.right.getColumns().keys()]).toStrictEqual([
        'index',
        'name',
        'flag',
      ]);

      const row = result.right.getRow(0);
      const index = row.get('index');
      expect(index).toBe(0);
      const name = row.get('name');
      expect(name).toBe('      text with leading whitespace');

      for (let rowIdx = 1; rowIdx < result.right.getNumberOfRows(); rowIdx++) {
        const row = result.right.getRow(rowIdx);
        const index = row.get('index');
        expect(index).toBe(rowIdx);
      }
    });

    it('should not skip leading or trailing whitespace if the relevant block properties are false', async () => {
      const text = readJvTestAsset('valid-without-header-without-trim.jv');

      const testWorkbook = await readTestWorkbook('test-with-whitespace.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(3);
        expect(result.right.getNumberOfRows()).toEqual(3);
        const indexColumn = result.right.getColumn('index')?.values;
        expect(indexColumn).toBeDefined();
        assert(indexColumn !== undefined);
        indexColumn.forEach((cell) =>
          expect(cell).toBeInstanceOf(InvalidError),
        );
      }
    });
  });
});
