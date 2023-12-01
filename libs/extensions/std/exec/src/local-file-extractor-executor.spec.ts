import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import { getTestExecutionContext } from '@jvalue/jayvee-execution/test';
import {
  BlockDefinition,
  IOType,
  createJayveeServices,
} from '@jvalue/jayvee-language-server';
import {
  expectNoParserAndLexerErrors,
  loadTestExtensions,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import * as nock from 'nock';

import { LocalFileExtractorExecutor } from './local-file-extractor-executor';

describe('Validation of LocalFileExtractorExecutor', () => {
  let parse: (input: string) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

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
          name: 'test.txt',
          extension: 'txt',
          ioType: IOType.FILE,
          mimeType: R.MimeType.APPLICATION_OCTET_STREAM,
        }),
      );
    }
  });

  it('should diagnose error on file not found', async () => {
    const text = readJvTestAsset('valid-local-file.jv');

    const result = await parseAndExecuteExecutor(text);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'Error reading file: ENOENT: no such file or directory',
      );
    }
  });

  // Add more test cases as needed
});
