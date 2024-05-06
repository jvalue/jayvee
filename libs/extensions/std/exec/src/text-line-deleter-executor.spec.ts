// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import * as R from '@jvalue/jayvee-execution';
import {
  createTextFileFromLocalFile,
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

import { TextLineDeleterExecutor } from './text-line-deleter-executor';

describe('Validation of TextLineDeleterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/text-line-deleter-executor/',
  );

  function readTestFile(fileName: string): R.TextFile {
    const absoluteFileName = path.resolve(
      __dirname,
      '../test/assets/text-line-deleter-executor/',
      fileName,
    );
    return createTextFileFromLocalFile(absoluteFileName);
  }

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.TextFile,
  ): Promise<R.Result<R.TextFile>> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new TextLineDeleterExecutor().doExecute(
      IOInput,
      getTestExecutionContext(locator, document, services, [block]),
    );
  }

  beforeAll(async () => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    await loadTestExtensions(services, [
      path.resolve(__dirname, '../test/test-extension/TestBlockTypes.jv'),
    ]);
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  it('should diagnose no error on valid text file with at least one line', async () => {
    const text = readJvTestAsset('valid-first-line.jv');

    const testFile = readTestFile('test.txt');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TEXT_FILE);
      expect(result.right.content).toEqual(
        expect.arrayContaining(['Test  File']),
      );
    }
  });

  it('should diagnose no error on empty lines parameter', async () => {
    const text = readJvTestAsset('valid-no-line.jv');

    const testFile = readTestFile('test.txt');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TEXT_FILE);
      expect(result.right.content).toEqual(
        expect.arrayContaining(['Multiline', 'Test  File']),
      );
    }
  });

  it('should diagnose error on empty text', async () => {
    const text = readJvTestAsset('valid-first-line.jv');

    const testFile = readTestFile('test-empty.txt');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'Line 1 does not exist in the text file, only 0 line(s) are present',
      );
    }
  });

  it('should diagnose no error on duplicate line', async () => {
    const text = readJvTestAsset('valid-duplicate-line.jv');

    const testFile = readTestFile('test.txt');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TEXT_FILE);
      expect(result.right.content).toEqual(
        expect.arrayContaining(['Test  File']),
      );
    }
  });
});
