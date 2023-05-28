// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  ColumnId,
  ValidationContext,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import { validateColumnId } from '../../../lib/validation/checks/column-id';
import {
  ParseHelperOptions,
  extractColumnIdFromBlockProperty,
  parseHelper,
  readJvTestAsset,
  validationAcceptorMockImpl,
} from '../../../test';

describe('column-id validation tests', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  beforeAll(() => {
    // Register std extension
    useExtension(new StdLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
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

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error if denoted with *', async () => {
    const text = readJvTestAsset('column-id/valid-column-id-asterix.jv');

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('error on lower case denotion', async () => {
    const text = readJvTestAsset('column-id/invalid-column-id-lower-case.jv');

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Columns need to be denoted via capital letters or the * character`,
      expect.any(Object),
    );
  });

  it('error on camel case', async () => {
    const text = readJvTestAsset('column-id/invalid-column-id-camel-case.jv');

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Columns need to be denoted via capital letters or the * character`,
      expect.any(Object),
    );
  });

  it('error on snake case', async () => {
    const text = readJvTestAsset('column-id/invalid-column-id-snake-case.jv');

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Columns need to be denoted via capital letters or the * character`,
      expect.any(Object),
    );
  });

  it('error on pascal case', async () => {
    const text = readJvTestAsset('column-id/invalid-column-id-pascal-case.jv');

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Columns need to be denoted via capital letters or the * character`,
      expect.any(Object),
    );
  });
});
