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

import { TextFileInterpreterExecutor } from './text-file-interpreter-executor';

describe('Validation of TextFileInterpreterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/text-file-interpreter-executor/',
  );

  function readTestFile(fileName: string): R.BinaryFile {
    const absoluteFileName = path.resolve(
      __dirname,
      '../test/assets/text-file-interpreter-executor/',
      fileName,
    );
    return createBinaryFileFromLocalFile(absoluteFileName);
  }

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.BinaryFile,
  ): Promise<R.Result<R.TextFile>> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new TextFileInterpreterExecutor().doExecute(
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

  it('should diagnose no error on valid text file', async () => {
    const text = readJvTestAsset('valid-default-file-interpreter.jv');

    const testFile = readTestFile('test.txt');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TEXT_FILE);
      expect(result.right.content).toBe(`Multiline 
Test  File
`);
    }
  });

  it('should diagnose no error on non text file', async () => {
    const text = readJvTestAsset('valid-default-file-interpreter.jv');

    const testFile = readTestFile('gtfs-vehicle');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.TEXT_FILE);
      const expectedBytes = Buffer.from([
        0xa, 0xd, 0xa, 0x3, 0x32, 0x2e, 0x30, 0x10, 0x0, 0x18, 0xe9, 0xa9, 0xba,
        0xef, 0xbf, 0xbd, 0x6, 0x12, 0x45, 0xa, 0x11, 0x76, 0x65, 0x68, 0x69,
        0x63, 0x6c, 0x65, 0x3a, 0x32, 0x36, 0x38, 0x34, 0x33, 0x35, 0x38, 0x35,
        0x37, 0x22, 0x30, 0xa, 0xe, 0xa, 0x8, 0x31, 0x35, 0x39, 0x32, 0x33,
        0x34, 0x37, 0x34, 0x2a, 0x2, 0x31, 0x30, 0x12, 0xf, 0xd, 0x27, 0xef,
        0xbf, 0xbd, 0x39, 0x42, 0x15, 0xef, 0xbf, 0xbd, 0xf, 0x1f, 0xef, 0xbf,
        0xbd, 0x1d, 0x0, 0x0, 0x2c, 0x43, 0x28, 0x0, 0x42, 0xb, 0xa, 0x9, 0x32,
        0x36, 0x38, 0x34, 0x33, 0x35, 0x38, 0x35, 0x37,
      ]);
      const actualBytes = Buffer.from(result.right.content);
      expect(actualBytes).toStrictEqual(expectedBytes);
    }
  });
});
