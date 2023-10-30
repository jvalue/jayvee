// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import { getTestExecutionContext } from '@jvalue/jayvee-execution/test';
import { TabularLangExtension } from '@jvalue/jayvee-extensions/tabular/lang';
import {
  BlockDefinition,
  IOType,
  createJayveeServices,
  useExtension,
} from '@jvalue/jayvee-language-server';
import {
  ParseHelperOptions,
  TestLangExtension,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { createWorkbookFromLocalExcelFile } from '../../test/util';

import { TableInterpreterExecutor } from './table-interpreter-executor';

describe('Validation of TableInterpreterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

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
    const document = await parse(input, { validationChecks: 'all' });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new TableInterpreterExecutor().doExecute(
      IOInput,
      getTestExecutionContext(locator, document, [block]),
    );
  }

  beforeAll(() => {
    // Register extensions
    useExtension(new TabularLangExtension());
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
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
        expect(result.right.getNumberOfRows()).toEqual(16);
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

    it('should diagnose skipping row on wrong cell valuetype', async () => {
      const text = readJvTestAsset('valid-wrong-valuetype-with-header.jv');

      const testWorkbook = await readTestWorkbook('test-with-header.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(3);
        expect(result.right.getNumberOfRows()).toEqual(0);
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

    it('should diagnose skipping row on wrong cell valuetype', async () => {
      const text = readJvTestAsset('valid-wrong-valuetype-without-header.jv');

      const testWorkbook = await readTestWorkbook('test-without-header.xlsx');
      const result = await parseAndExecuteExecutor(
        text,
        testWorkbook.getSheetByName('Sheet1') as R.Sheet,
      );

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(3);
        expect(result.right.getNumberOfRows()).toEqual(0);
      }
    });
  });
});
