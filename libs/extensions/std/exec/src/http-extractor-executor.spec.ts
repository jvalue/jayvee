// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import { getTestExecutionContext } from '@jvalue/jayvee-execution/test';
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
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
import * as nock from 'nock';

import { HttpExtractorExecutor } from './http-extractor-executor';

describe('Validation of HttpExtractorExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/http-extractor-executor/',
  );

  async function parseAndExecuteExecutor(
    input: string,
  ): Promise<R.Result<R.BinaryFile>> {
    const document = await parse(input, { validationChecks: 'all' });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new HttpExtractorExecutor().doExecute(
      R.NONE,
      getTestExecutionContext(locator, document, [block]),
    );
  }

  beforeAll(() => {
    // Register extensions
    useExtension(new StdLangExtension());
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    nock.restore();
  });

  it('should diagnose no error on valid http url', async () => {
    const text = readJvTestAsset('valid-http.jv');
    nock('http://localhost')
      .get('/test.txt')
      .replyWithFile(
        200,
        path.resolve(
          __dirname,
          '../test/assets/http-extractor-executor/test.txt',
        ),
        {
          'Content-Type': 'text/plain',
        },
      );

    const result = await parseAndExecuteExecutor(text);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          name: 'test.txt',
          extension: 'txt',
          ioType: IOType.FILE,
          mimeType: R.MimeType.APPLICATION_OCTET_STREAM,
        }),
      );
    }
  });

  it('should diagnose no error on valid https url', async () => {
    const text = readJvTestAsset('valid-https.jv');
    nock('https://localhost')
      .get('/test.txt')
      .replyWithFile(
        200,
        path.resolve(
          __dirname,
          '../test/assets/http-extractor-executor/test.txt',
        ),
        {
          'Content-Type': 'text/plain',
        },
      );

    const result = await parseAndExecuteExecutor(text);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          name: 'test.txt',
          extension: 'txt',
          ioType: IOType.FILE,
          mimeType: R.MimeType.APPLICATION_OCTET_STREAM,
        }),
      );
    }
  });

  /* it('should diagnose no error on retries exceeded', () => {});

  it('should diagnose no error on url not found', () => {});

  it('should diagnose no error on download error', () => {});

  it('should diagnose no error on ignoring redirects', () => {});*/
});
