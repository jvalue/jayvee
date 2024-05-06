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

import { createWorkbookFromLocalExcelFile } from '../../test/util';

import { CellRangeSelectorExecutor } from './cell-range-selector-executor';

describe('Validation of CellRangeSelectorExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/cell-range-selector-executor/',
  );

  async function readTestWorkbook(fileName: string): Promise<R.Workbook> {
    const absoluteFileName = path.resolve(
      __dirname,
      '../../test/assets/cell-range-selector-executor/',
      fileName,
    );
    return await createWorkbookFromLocalExcelFile(absoluteFileName);
  }

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.Sheet,
  ): Promise<R.Result<R.Sheet>> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new CellRangeSelectorExecutor().doExecute(
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

  it('should diagnose no error on valid selector', async () => {
    const text = readJvTestAsset('valid-A1-C.jv');

    const testWorkbook = await readTestWorkbook('test-A1-C16.xlsx');
    const result = await parseAndExecuteExecutor(
      text,
      testWorkbook.getSheetByName('Sheet1') as R.Sheet,
    );

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.SHEET);
      expect(result.right.getNumberOfColumns()).toEqual(3);
      expect(result.right.getNumberOfRows()).toEqual(16);
      expect(result.right.getHeaderRow()).toEqual(['0', 'Test', 'true']);
      expect(result.right.getData()).toEqual(
        expect.arrayContaining([
          ['0', 'Test', 'true'],
          ['1', 'Test', 'false'],
          ['15', 'Test', 'true'],
        ]),
      );
    }
  });

  it('should diagnose no error on empty column', async () => {
    const text = readJvTestAsset('valid-A1-C.jv');

    const testWorkbook = await readTestWorkbook('test-B1-C2.xlsx');
    const result = await parseAndExecuteExecutor(
      text,
      testWorkbook.getSheetByName('Sheet1') as R.Sheet,
    );

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.SHEET);
      expect(result.right.getNumberOfColumns()).toEqual(3);
      expect(result.right.getNumberOfRows()).toEqual(2);
      expect(result.right.getHeaderRow()).toEqual(['', 'Test', 'true']);
      expect(result.right.getData()).toEqual([
        ['', 'Test', 'true'],
        ['', 'Test', 'false'],
      ]);
    }
  });

  it('should diagnose error on selector out of bounds', async () => {
    const text = readJvTestAsset('valid-A1-E4.jv');

    const testWorkbook = await readTestWorkbook('test-A1-C16.xlsx');
    const result = await parseAndExecuteExecutor(
      text,
      testWorkbook.getSheetByName('Sheet1') as R.Sheet,
    );

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'The specified cell range does not fit the sheet',
      );
    }
  });

  it('should diagnose error on selector on empty sheet', async () => {
    const text = readJvTestAsset('valid-A1-C.jv');

    const testWorkbook = await readTestWorkbook('test-empty.xlsx');
    const result = await parseAndExecuteExecutor(
      text,
      testWorkbook.getSheetByName('Sheet1') as R.Sheet,
    );

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'The specified cell range does not fit the sheet',
      );
    }
  });

  it('should diagnose error on single column selector on empty sheet', async () => {
    const text = readJvTestAsset('valid-A1-A4.jv');

    const testWorkbook = await readTestWorkbook('test-empty.xlsx');
    const result = await parseAndExecuteExecutor(
      text,
      testWorkbook.getSheetByName('Sheet1') as R.Sheet,
    );

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'The specified cell range does not fit the sheet',
      );
    }
  });
});
