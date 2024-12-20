// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFile } from 'node:fs/promises';
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

import { CSVToTableInterpreterExecutor } from './csv-to-table-interpreter-executor';

describe('Validation of CSVToTableInterpreterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/csv-to-table-interpreter-executor/',
  );

  async function readTestCSV(fileName: string): Promise<R.BinaryFile> {
    const absoluteFileName = path.resolve(
      __dirname,
      '../../test/assets/csv-to-table-interpreter-executor/',
      fileName,
    );

    const content = await readFile(absoluteFileName);

    return new R.BinaryFile(
      fileName,
      R.FileExtension.CSV,
      R.MimeType.TEXT_CSV,
      content,
    );
  }

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.BinaryFile,
  ): Promise<R.Result<R.Table>> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new CSVToTableInterpreterExecutor().doExecute(
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

      const testFile = await readTestCSV('test-with-header.csv');
      const result = await parseAndExecuteExecutor(text, testFile);

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

      const testFile = await readTestCSV('test-with-header.csv');
      const result = await parseAndExecuteExecutor(text, testFile);

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(0);
        expect(result.right.getNumberOfRows()).toEqual(0);
      }
    });

    it('should diagnose skipping row on wrong cell value type', async () => {
      const text = readJvTestAsset('valid-wrong-value-type-with-header.jv');

      const testFile = await readTestCSV('test-with-header.csv');
      const result = await parseAndExecuteExecutor(text, testFile);

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

      const testFile = await readTestCSV('test-without-header.csv');
      const result = await parseAndExecuteExecutor(text, testFile);

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

      const testFile = await readTestCSV('test-with-header.csv');
      const result = await parseAndExecuteExecutor(text, testFile);

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
      const text = readJvTestAsset('valid-empty-columns-without-header.jv');

      const testFile = await readTestCSV('test-without-header.csv');
      const result = await parseAndExecuteExecutor(text, testFile);

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(0);
        expect(result.right.getNumberOfRows()).toEqual(0);
      }
    });

    it('should diagnose empty table on empty sheet', async () => {
      const text = readJvTestAsset('valid-without-header.jv');

      const testFile = await readTestCSV('test-empty.csv');
      const result = await parseAndExecuteExecutor(text, testFile);

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.isEmpty()).toEqual(true);
      }
    });

    it('should diagnose skipping row on wrong cell value type', async () => {
      const text = readJvTestAsset('valid-wrong-value-type-without-header.jv');

      const testFile = await readTestCSV('test-without-header.csv');
      const result = await parseAndExecuteExecutor(text, testFile);

      expect(R.isErr(result)).toEqual(false);
      if (R.isOk(result)) {
        expect(result.right.ioType).toEqual(IOType.TABLE);
        expect(result.right.getNumberOfColumns()).toEqual(3);
        expect(result.right.getNumberOfRows()).toEqual(0);
      }
    });
  });
});
