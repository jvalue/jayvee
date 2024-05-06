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

import { RowDeleterExecutor } from './row-deleter-executor';

describe('Validation of RowDeleterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/row-deleter-executor/',
  );

  async function readTestWorkbook(fileName: string): Promise<R.Workbook> {
    const absoluteFileName = path.resolve(
      __dirname,
      '../../test/assets/row-deleter-executor/',
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

    return new RowDeleterExecutor().doExecute(
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

  it('should diagnose no error on valid single row deleter', async () => {
    const text = readJvTestAsset('valid-single-row-deleter.jv');

    const testWorkbook = await readTestWorkbook('test-A1-C16.xlsx');
    const result = await parseAndExecuteExecutor(
      text,
      testWorkbook.getSheetByName('Sheet1') as R.Sheet,
    );

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.SHEET);
      expect(result.right.getNumberOfColumns()).toEqual(3);
      expect(result.right.getNumberOfRows()).toEqual(15);
      expect(result.right.getHeaderRow()).toEqual(['1', 'Test', 'false']);
      expect(result.right.getData()).not.toEqual(
        expect.arrayContaining([['0', 'Test', 'true']]),
      );
    }
  });

  it('should diagnose no error on valid multiple row deleter', async () => {
    const text = readJvTestAsset('valid-multiple-row-deleter.jv');

    const testWorkbook = await readTestWorkbook('test-A1-C16.xlsx');
    const result = await parseAndExecuteExecutor(
      text,
      testWorkbook.getSheetByName('Sheet1') as R.Sheet,
    );

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.SHEET);
      expect(result.right.getNumberOfColumns()).toEqual(3);
      expect(result.right.getNumberOfRows()).toEqual(14);
      expect(result.right.getHeaderRow()).toEqual(['1', 'Test', 'false']);
      expect(result.right.getData()).not.toEqual(
        expect.arrayContaining([
          ['0', 'Test', 'true'],
          ['4', 'Test', 'true'],
        ]),
      );
    }
  });

  it('should diagnose error on deleting non existing row', async () => {
    const text = readJvTestAsset('valid-multiple-row-deleter.jv');

    const testWorkbook = await readTestWorkbook('test-A1-B2.xlsx');
    const result = await parseAndExecuteExecutor(
      text,
      testWorkbook.getSheetByName('Sheet1') as R.Sheet,
    );

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'The specified row 5 does not exist in the sheet',
      );
    }
  });

  it('should diagnose only one row deletion on duplicate rows', async () => {
    const text = readJvTestAsset('valid-duplicate-row.jv');

    const testWorkbook = await readTestWorkbook('test-A1-C16.xlsx');
    const result = await parseAndExecuteExecutor(
      text,
      testWorkbook.getSheetByName('Sheet1') as R.Sheet,
    );

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.SHEET);
      expect(result.right.getNumberOfColumns()).toEqual(3);
      expect(result.right.getNumberOfRows()).toEqual(15);
      expect(result.right.getHeaderRow()).toEqual(['1', 'Test', 'false']);
      expect(result.right.getData()).not.toEqual(
        expect.arrayContaining([['0', 'Test', 'true']]),
      );
    }
  });
});
