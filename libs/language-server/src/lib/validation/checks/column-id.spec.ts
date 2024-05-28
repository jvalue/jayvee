// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type ColumnId,
  type JayveeServices,
  createJayveeServices,
  isColumnId,
} from '../../../lib';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  extractTestElements,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateColumnId } from './column-id';

describe('Validation of ColumnId', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidateColumnId(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allColumnIds = extractTestElements(document, (x): x is ColumnId =>
      isColumnId(x),
    );

    for (const columnId of allColumnIds) {
      validateColumnId(
        columnId,
        createJayveeValidationProps(validationAcceptorMock, services),
      );
    }
  }

  beforeAll(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
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
