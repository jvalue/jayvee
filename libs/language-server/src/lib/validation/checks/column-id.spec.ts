// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  ColumnId,
  ValidationContext,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';
import { TestLangExtension } from '../../../test/extension';

import { validateColumnId } from './column-id';

describe('Validation of ColumnId', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidateColumnId(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const columnId = locator.getAstNode<ColumnId>(
      document.parseResult.value,
      'pipelines@0/blocks@0/body/properties@0/value/columnId',
    ) as ColumnId;

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));
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

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should have no error if denoted with capital letter', async () => {
    const text = readJvTestAsset(
      'column-id/valid-column-id-capital-letters.jv',
    );

    await parseAndValidateColumnId(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error if denoted with *', async () => {
    const text = readJvTestAsset('column-id/valid-column-id-asterix.jv');

    await parseAndValidateColumnId(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on lower case denotion', async () => {
    const text = readJvTestAsset('column-id/invalid-column-id-lower-case.jv');

    await parseAndValidateColumnId(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Columns need to be denoted via capital letters or the * character`,
      expect.any(Object),
    );
  });
});
