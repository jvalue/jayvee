// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import { getTestExecutionContext } from '@jvalue/jayvee-execution/test';
import {
  BlockDefinition,
  IOType,
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

import { createTextFileFromLocalFile } from '../test';

import { TextRangeSelectorExecutor } from './text-range-selector-executor';

describe('Validation of TextRangeSelectorExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/text-range-selector-executor/',
  );

  function readTestFile(fileName: string): R.TextFile {
    const absoluteFileName = path.resolve(
      __dirname,
      '../test/assets/text-range-selector-executor/',
      fileName,
    );
    return createTextFileFromLocalFile(absoluteFileName);
  }

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.TextFile,
  ): Promise<R.Result<R.TextFile>> {
    const document = await parse(input, { validationChecks: 'all' });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new TextRangeSelectorExecutor().doExecute(
      IOInput,
      getTestExecutionContext(locator, document, [block]),
    );
  }

  beforeAll(async () => {
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    await loadTestExtensions(services, [
      path.resolve(__dirname, '../test/test-extension/TestBlockTypes.jv'),
    ]);
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  it('should diagnose no error on valid file', async () => {
    const text = readJvTestAsset('valid-range.jv');

    const testFile = readTestFile('test.txt');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TEXT_FILE);
      expect(result.right.content).toEqual(
        expect.arrayContaining(['Multiline', 'Test ']),
      );
    }
  });

  it('should diagnose no error on empty text file', async () => {
    const text = readJvTestAsset('valid-range.jv');

    const testFile = readTestFile('test-empty.txt');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TEXT_FILE);
      expect(result.right.content).toHaveLength(0);
    }
  });
});