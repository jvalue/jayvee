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

import { LocalFileExtractorExecutor } from './local-file-extractor-executor';

describe('Validation of LocalFileExtractorExecutor', () => {
  let parse: (input: string) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/local-file-extractor-executor/',
  );

  async function parseAndExecuteExecutor(
    input: string,
  ): Promise<R.Result<R.BinaryFile>> {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new LocalFileExtractorExecutor().doExecute(
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

  it('should diagnose no error on valid local file path', async () => {
    const text = readJvTestAsset('valid-local-file.jv');

    const result = await parseAndExecuteExecutor(text);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          name: 'local-file-test.csv',
          extension: 'csv',
          ioType: IOType.FILE,
          mimeType: R.MimeType.TEXT_CSV,
        }),
      );
    }
  });

  it('should diagnose error on file not found', async () => {
    const text = readJvTestAsset('invalid-file-not-found.jv');

    const result = await parseAndExecuteExecutor(text);

    expect(R.isErr(result)).toEqual(true);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        `ENOENT: no such file or directory, open './does-not-exist.csv'`,
      );
    }
  });

  it('should diagnose error on path traversal at the start of the path', async () => {
    const text = readJvTestAsset('invalid-path-traversal-at-start.jv');

    const result = await parseAndExecuteExecutor(text);

    expect(R.isErr(result)).toEqual(true);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        `File path cannot include "..". Path traversal is restricted.`,
      );
    }
  });

  it('should diagnose error on path traversal in the path', async () => {
    const text = readJvTestAsset('invalid-path-traversal-in-path.jv');

    const result = await parseAndExecuteExecutor(text);

    expect(R.isErr(result)).toEqual(true);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        `File path cannot include "..". Path traversal is restricted.`,
      );
    }
  });
});
