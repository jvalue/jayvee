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

import { CellWriterExecutor } from './cell-writer-executor';

describe('Validation of CellWriterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/cell-writer-executor/',
  );

  async function readTestWorkbook(fileName: string): Promise<R.Workbook> {
    const absoluteFileName = path.resolve(
      __dirname,
      '../../test/assets/cell-writer-executor/',
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

    return new CellWriterExecutor().doExecute(
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

  it('should diagnose no error on valid single cell writer', async () => {
    const text = readJvTestAsset('valid-single-cell-writer.jv');

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
      expect(result.right.getHeaderRow()).toEqual(['16', 'Test', 'true']);
      expect(result.right.getData()).toEqual(
        expect.arrayContaining([
          ['16', 'Test', 'true'],
          ['1', 'Test', 'false'],
          ['15', 'Test', 'true'],
        ]),
      );
    }
  });

  it('should diagnose no error on valid cell range writer', async () => {
    const text = readJvTestAsset('valid-cell-range-writer.jv');

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
      expect(result.right.getHeaderRow()).toEqual(['16', 'Test2', '']);
      expect(result.right.getData()).toEqual(
        expect.arrayContaining([
          ['16', 'Test2', ''],
          ['1', 'Test', 'false'],
          ['15', 'Test', 'true'],
        ]),
      );
    }
  });

  it('should diagnose error on single cell writer on empty sheet', async () => {
    const text = readJvTestAsset('valid-single-cell-writer.jv');

    const testWorkbook = await readTestWorkbook('test-empty.xlsx');
    const result = await parseAndExecuteExecutor(
      text,
      testWorkbook.getSheetByName('Sheet1') as R.Sheet,
    );

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'Some specified cells do not exist in the sheet',
      );
    }
  });
});
