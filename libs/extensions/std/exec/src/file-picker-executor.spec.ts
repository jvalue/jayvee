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

import { FilePickerExecutor } from './file-picker-executor';

describe('Validation of FilePickerExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;
  let fileSystem: R.FileSystem;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/file-picker-executor/',
  );

  function uploadTestFile(fileName: string) {
    const absoluteFileName = path.resolve(
      __dirname,
      '../test/assets/file-picker-executor/',
      fileName,
    );
    fileSystem.putFile(
      `/${fileName}`,
      createBinaryFileFromLocalFile(absoluteFileName),
    );
  }

  async function parseAndExecuteArchiveInterpreter(
    input: string,
    IOInput: R.FileSystem,
  ): Promise<R.Result<R.BinaryFile | null>> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new FilePickerExecutor().doExecute(
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
  beforeEach(() => {
    // Create fresh filesystem
    fileSystem = new R.InMemoryFileSystem();
  });

  it('should diagnose no error on valid txt file picker', async () => {
    const text = readJvTestAsset('valid-file-picker.jv');
    uploadTestFile('test.txt');

    const result = await parseAndExecuteArchiveInterpreter(text, fileSystem);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          name: 'test.txt',
          extension: 'txt',
          ioType: IOType.FILE,
          mimeType: R.MimeType.TEXT_PLAIN,
        }),
      );
    }
  });

  it('should diagnose error on file not found', async () => {
    const text = readJvTestAsset('valid-file-picker.jv');

    const result = await parseAndExecuteArchiveInterpreter(text, fileSystem);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(`File '/test.txt' not found`);
    }
  });

  it('should work if the filename starts with a dot', async () => {
    const text = readJvTestAsset('dot-valid-file-picker.jv');
    uploadTestFile('test.txt');

    const result = await parseAndExecuteArchiveInterpreter(text, fileSystem);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          name: 'test.txt',
          extension: 'txt',
          ioType: IOType.FILE,
          mimeType: R.MimeType.TEXT_PLAIN,
        }),
      );
    }
  });
});
