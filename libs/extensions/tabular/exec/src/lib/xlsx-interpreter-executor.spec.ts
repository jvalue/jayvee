// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import * as R from '@jvalue/jayvee-execution';
import {
  createBinaryFileFromLocalFile,
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

import { XLSXInterpreterExecutor } from './xlsx-interpreter-executor';

describe('Validation of XLSXInterpreterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/xlsx-interpreter-executor/',
  );

  function readTestFile(fileName: string): R.BinaryFile {
    const absoluteFileName = path.resolve(
      __dirname,
      '../../test/assets/xlsx-interpreter-executor/',
      fileName,
    );
    return createBinaryFileFromLocalFile(absoluteFileName);
  }

  function expectSheetRowAndColumnSize(
    sheet: R.Sheet | undefined,
    cols: number,
    rows: number,
  ) {
    expect(sheet?.getNumberOfColumns()).toEqual(cols);
    expect(sheet?.getNumberOfRows()).toEqual(rows);
  }

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.BinaryFile,
  ): Promise<R.Result<R.Workbook>> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new XLSXInterpreterExecutor().doExecute(
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

  it('should diagnose no error on single sheet excel', async () => {
    const text = readJvTestAsset('valid-excel-interpreter.jv');

    const testFile = readTestFile('test-excel.xlsx');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.WORKBOOK);
      const sheets = result.right.getSheets();
      expect(sheets.size).toEqual(1);
      expectSheetRowAndColumnSize(sheets.get('Sheet1'), 3, 6);
    }
  });

  it('should diagnose no error on multiple sheet excel', async () => {
    const text = readJvTestAsset('valid-excel-interpreter.jv');

    const testFile = readTestFile('test-multiple-sheets.xlsx');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.WORKBOOK);
      const sheets = result.right.getSheets();
      expect(sheets.size).toEqual(3);
      expectSheetRowAndColumnSize(sheets.get('Sheet1'), 3, 6);
      expectSheetRowAndColumnSize(sheets.get('CustomSheet'), 0, 0);
      expectSheetRowAndColumnSize(sheets.get('Sheet3'), 0, 0);
    }
  });

  it('should diagnose no error on empty excel', async () => {
    const text = readJvTestAsset('valid-excel-interpreter.jv');

    const testFile = readTestFile('test-empty.xlsx');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.WORKBOOK);
      const sheets = result.right.getSheets();
      expect(sheets.size).toEqual(1);
      expectSheetRowAndColumnSize(sheets.get('Sheet1'), 0, 0);
    }
  });
});
