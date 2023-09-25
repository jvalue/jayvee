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

import { ArchiveInterpreterExecutor } from './archive-interpreter-executor';

describe('Validation of ArchiveInterpreterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(__dirname, '../test/assets/');

  function readTestArchive(fileName: string) {
    return readFileSync(path.resolve(__dirname, '../test/assets/', fileName));
  }

  async function parseAndExecuteArchiveInterpreter(
    input: string,
    IOInput: R.BinaryFile,
  ): Promise<R.Result<R.FileSystem>> {
    const document = await parse(input, { validationChecks: 'all' });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new ArchiveInterpreterExecutor().doExecute(
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
  });

  it('should diagnose no error on valid zip BinaryFile', async () => {
    const text = readJvTestAsset(
      'archive-interpreter-executor/valid-zip-archive-interpreter.jv',
    );

    try {
      const testFile = readTestArchive(
        'archive-interpreter-executor/valid-zip.zip',
      );
      const result = await parseAndExecuteArchiveInterpreter(
        text,
        new R.BinaryFile(
          'testArchive.zip',
          R.FileExtension.ZIP,
          R.MimeType.APPLICATION_ZIP,
          testFile,
        ),
      );

      if (R.isErr(result)) {
        throw new Error(result.left.message);
      }
      expect(result.right.ioType).toEqual(IOType.FILE_SYSTEM);
      expect(result.right.getFile('/test.txt')).toEqual(
        expect.objectContaining({
          name: 'test.txt',
          extension: 'txt',
          ioType: IOType.FILE,
          mimeType: R.MimeType.TEXT_PLAIN,
        }),
      );
    } catch (e) {
      expect(e).toEqual(undefined);
    }
  });

  it('should diagnose no error on valid gz BinaryFile', async () => {
    const text = readJvTestAsset(
      'archive-interpreter-executor/valid-gz-archive-interpreter.jv',
    );

    try {
      const testFile = readTestArchive(
        'archive-interpreter-executor/valid-gz.gz',
      );
      const result = await parseAndExecuteArchiveInterpreter(
        text,
        new R.BinaryFile(
          'testArchive.gz',
          R.FileExtension.ZIP,
          R.MimeType.APPLICATION_OCTET_STREAM,
          testFile,
        ),
      );

      if (R.isErr(result)) {
        throw new Error(result.left.message);
      }
      expect(result.right.ioType).toEqual(IOType.FILE_SYSTEM);
      expect(result.right.getFile('/testArchive')).toEqual(
        expect.objectContaining({
          name: 'testArchive',
          extension: '',
          ioType: IOType.FILE,
          mimeType: R.MimeType.APPLICATION_OCTET_STREAM,
        }),
      );
    } catch (e) {
      expect(e).toEqual(undefined);
    }
  });

  it('should diagnose error on zip as gz archive', async () => {
    const text = readJvTestAsset(
      'archive-interpreter-executor/valid-gz-archive-interpreter.jv',
    );

    try {
      const testFile = readTestArchive(
        'archive-interpreter-executor/valid-zip.zip',
      );
      const result = await parseAndExecuteArchiveInterpreter(
        text,
        new R.BinaryFile(
          'testArchive.zip',
          R.FileExtension.ZIP,
          R.MimeType.APPLICATION_ZIP,
          testFile,
        ),
      );

      if (R.isOk(result)) {
        throw new Error('Should throw processing error');
      }
      expect(result.left.message).toEqual(
        'Unexpected Error undefined occured during processing',
      );
    } catch (e) {
      expect(e).toEqual(undefined);
    }
  });

  it('should diagnose error on invalid archive type', async () => {
    const text = readJvTestAsset(
      'archive-interpreter-executor/valid-7z-archive-interpreter.jv',
    );

    try {
      const testFile = readTestArchive(
        'archive-interpreter-executor/valid-7z.7z',
      );
      const result = await parseAndExecuteArchiveInterpreter(
        text,
        new R.BinaryFile(
          'testArchive.7z',
          R.FileExtension.ZIP,
          R.MimeType.APPLICATION_OCTET_STREAM,
          testFile,
        ),
      );

      if (R.isOk(result)) {
        throw new Error('Should throw invalid archive type error');
      }
      expect(result.left.message).toEqual('Archive type is not supported');
    } catch (e) {
      expect(e).toEqual(undefined);
    }
  });

  it('should diagnose error on corrupted archive', async () => {
    const text = readJvTestAsset(
      'archive-interpreter-executor/valid-zip-archive-interpreter.jv',
    );

    try {
      const testFile = readTestArchive(
        'archive-interpreter-executor/invalid-corrupt-zip.zip',
      );
      const result = await parseAndExecuteArchiveInterpreter(
        text,
        new R.BinaryFile(
          'testArchive.zip',
          R.FileExtension.ZIP,
          R.MimeType.APPLICATION_ZIP,
          testFile,
        ),
      );

      if (R.isOk(result)) {
        throw new Error('Should not be able to extract corrupted archive');
      }
      expect(result.left.message).toEqual(
        "Unexpected Error Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html occured during processing",
      );
    } catch (e) {
      expect(e).toEqual(undefined);
    }
  });
});
