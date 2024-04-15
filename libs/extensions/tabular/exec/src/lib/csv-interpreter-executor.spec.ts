// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import {
  createTextFileFromLocalFile,
  getTestExecutionContext,
} from '@jvalue/jayvee-execution/test';
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

import { CSVInterpreterExecutor } from './csv-interpreter-executor';

describe('Validation of CSVInterpreterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/csv-interpreter-executor/',
  );

  function readTestFile(fileName: string): R.TextFile {
    const absoluteFileName = path.resolve(
      __dirname,
      '../../test/assets/csv-interpreter-executor/',
      fileName,
    );
    return createTextFileFromLocalFile(absoluteFileName);
  }

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.TextFile,
  ): Promise<R.Result<R.Sheet>> {
    const document = await parse(input, { validationChecks: 'all' });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new CSVInterpreterExecutor().doExecute(
      IOInput,
      getTestExecutionContext(locator, document, [block]),
    );
  }

  beforeAll(async () => {
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    await loadTestExtensions(services, [
      path.resolve(__dirname, '../../test/test-extension/TestBlockTypes.jv'),
    ]);
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  it('should diagnose no error on valid csv file', async () => {
    const text = readJvTestAsset('valid-csv-interpreter.jv');

    const testCsv = readTestFile('valid-csv.csv');
    const result = await parseAndExecuteExecutor(text, testCsv);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.SHEET);
      expect(result.right.getNumberOfColumns()).toEqual(2);
      expect(result.right.getNumberOfRows()).toEqual(2);
      expect(result.right.getData()).toEqual([
        ['Test', 'true'],
        ['Test', 'false'],
      ]);
    }
  });
});
