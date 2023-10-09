// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'fs';
import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import { getTestExecutionContext } from '@jvalue/jayvee-execution/test';
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

import { FilePickerExecutor } from './file-picker-executor';
import {
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromContentTypeString,
} from './file-util';

describe('Validation of FilePickerExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;
  let fileSystem: R.FileSystem;

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/file-picker-executor/',
  );

  function uploadTestFile(fileName: string) {
    const extName = path.extname(fileName);
    const mimeType =
      inferMimeTypeFromContentTypeString(extName) ||
      R.MimeType.APPLICATION_OCTET_STREAM;
    const fileExtension =
      inferFileExtensionFromFileExtensionString(extName) ||
      R.FileExtension.NONE;
    const file = readFileSync(
      path.resolve(__dirname, '../test/assets/file-picker-executor/', fileName),
    );

    fileSystem.putFile(
      `/${fileName}`,
      new R.BinaryFile(fileName, fileExtension, mimeType, file),
    );
  }

  async function parseAndExecuteArchiveInterpreter(
    input: string,
    IOInput: R.FileSystem,
  ): Promise<R.Result<R.BinaryFile | null>> {
    const document = await parse(input, { validationChecks: 'all' });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new FilePickerExecutor().doExecute(
      IOInput,
      getTestExecutionContext(locator, document, [block]),
    );
  }

  beforeAll(() => {
    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
    // Prepare filesystem
    fileSystem = new R.InMemoryFileSystem();
  });

  it('should diagnose no error on valid txt file picker', async () => {
    const text = readJvTestAsset('valid-file-picker.jv');
    uploadTestFile('test.txt');

    const result = await parseAndExecuteArchiveInterpreter(text, fileSystem);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right?.ioType).toEqual(IOType.FILE);
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
