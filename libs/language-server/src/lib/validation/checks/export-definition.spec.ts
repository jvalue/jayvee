// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type ExportDefinition,
  type JayveeServices,
  createJayveeServices,
  isExportDefinition,
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

import { validateExportDefinition } from './export-definition';

describe('Validation of ExportDefinition', () => {
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

  async function parseAndValidateExportDefinition(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allExportDefinitions = extractTestElements(
      document,
      (x): x is ExportDefinition => isExportDefinition(x),
    );

    for (const exportDefinition of allExportDefinitions) {
      validateExportDefinition(
        exportDefinition,
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

  it('should have no error if export has no alias', async () => {
    const text = readJvTestAsset(
      'export-definition/valid-export-definition-no-alias.jv',
    );

    await parseAndValidateExportDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error if export has viable alias', async () => {
    const text = readJvTestAsset(
      'export-definition/valid-export-definition-with-alias.jv',
    );

    await parseAndValidateExportDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have error if original element definition already exports element', async () => {
    const text = readJvTestAsset(
      'export-definition/invalid-export-definition-on-exported-element.jv',
    );

    await parseAndValidateExportDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      'Element X is already published at its definition.',
      expect.any(Object),
    );
  });

  it('should have error if two elements are exported under the same name', async () => {
    const text = readJvTestAsset(
      'export-definition/invalid-export-definition-same-name-exported-definition.jv',
    );

    await parseAndValidateExportDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      'This alias is ambiguous. There is another element published element with the same name "Z".',
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      'This alias is ambiguous. There is another element published element with the same name "Z".',
      expect.any(Object),
    );
  });

  it('should have error if there is already an element exported in element definition with the same name', async () => {
    const text = readJvTestAsset(
      'export-definition/invalid-export-definition-same-name-multiple-alias.jv',
    );

    await parseAndValidateExportDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      'This alias is ambiguous. There is another element published element with the same name "X".',
      expect.any(Object),
    );
  });
});
