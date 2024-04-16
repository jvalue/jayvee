// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

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
import * as nock from 'nock';

import { HttpExtractorExecutor } from './http-extractor-executor';

describe('Validation of HttpExtractorExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

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

  afterEach(() => {
    nock.restore();
  });

  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate();
    }
    nock.cleanAll();
  });

  it('should diagnose no error on valid http url', async () => {
    const text = readJvTestAsset('valid-http.jv');
    const nockScope = nock('http://localhost')
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
      expect(nockScope.isDone()).toEqual(true);
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
    const nockScope = nock('https://localhost')
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
      expect(nockScope.isDone()).toEqual(true);
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

  it('should diagnose no error on retry', async () => {
    const text = readJvTestAsset('valid-one-retry.jv');
    const nockScope404 = nock('https://localhost').get('/test.txt').reply(404);
    const nockScope200 = nock('https://localhost')
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
      expect(nockScope404.isDone()).toEqual(true);
      expect(nockScope200.isDone()).toEqual(true);
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

  it('should diagnose error on url not found', async () => {
    const text = readJvTestAsset('valid-http.jv');
    const nockScope = nock('http://localhost').get('/test.txt').reply(404);

    const result = await parseAndExecuteExecutor(text);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(nockScope.isDone()).toEqual(true);
      expect(result.left.message).toEqual(
        'HTTP fetch failed with code 404. Please check your connection.',
      );
    }
  });

  it('should diagnose error on ClientRequest error', async () => {
    const text = readJvTestAsset('valid-https.jv');
    const nockScope = nock('https://localhost')
      .get('/test.txt')
      .replyWithError('Test error');

    const result = await parseAndExecuteExecutor(text);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(nockScope.isDone()).toEqual(true);
      expect(result.left.message).toEqual('Test error');
    }
  });

  it('should diagnose error on ignoring redirects', async () => {
    const text = readJvTestAsset('valid-http.jv');
    const nockScope = nock('http://localhost').get('/test.txt').reply(301);

    const result = await parseAndExecuteExecutor(text);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(nockScope.isDone()).toEqual(true);
      expect(result.left.message).toEqual(
        'HTTP fetch was redirected with code 301. Redirects are either disabled or maximum number of redirects was exeeded.',
      );
    }
  });
});
