// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import { type AstNode, type LangiumDocument, URI } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  createJayveeServices,
  initializeWorkspace,
  isJayveeModel,
} from '../../../lib';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateImportDefinition } from './import-definition';

describe('Validation of ImportDefinition', () => {
  let services: JayveeServices;
  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  async function parse(
    relativeTestFilePath: string,
    options?: ParseHelperOptions,
  ): Promise<LangiumDocument<AstNode>> {
    const testFilePath = path.resolve(
      __dirname,
      '../../../test/assets/',
      relativeTestFilePath,
    );
    const testFileUri = URI.parse(testFilePath);
    const documentBuilder = services.shared.workspace.DocumentBuilder;
    await initializeWorkspace(services, [
      {
        name: 'projectDir',
        uri: workingDir,
      },
    ]);
    const testDocument =
      services.shared.workspace.LangiumDocuments.getDocument(testFileUri);

    assert(
      testDocument !== undefined,
      'Could not load test document. Error in test setup!',
    );

    await documentBuilder.build([testDocument], options);
    return testDocument;
  }

  const workingDir = path.resolve(__dirname, '../../../test/assets/');

  async function parseAndValidateImportDefinition(
    relativeTestFilePath: string,
  ) {
    const document = await parse(relativeTestFilePath);
    expectNoParserAndLexerErrors(document);

    const parsedModel = document.parseResult.value;
    assert(isJayveeModel(parsedModel), 'Test file is not valid Jayvee model');
    assert(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      parsedModel.imports !== undefined && parsedModel.imports.length > 0,
      'Test file does not contain imports',
    );

    for (const importDefinition of parsedModel.imports) {
      validateImportDefinition(
        importDefinition,
        createJayveeValidationProps(validationAcceptorMock, services),
      );
    }
  }

  beforeEach(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  describe('ImportDefinition syntax', () => {
    it('should have no error if file exists in same directory', async () => {
      const relativeTestFilePath =
        'import-definition/valid-imported-file-exists-same-dir.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should have no error if file exists in deeper directory', async () => {
      const relativeTestFilePath =
        'import-definition/valid-imported-file-exists-deeper-dir.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should have no error if file exists in deeper directory', async () => {
      const relativeTestFilePath =
        'import-definition/deeper/valid-imported-file-exists-higher-dir.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on imported file that does not exist', async () => {
      const relativeTestFilePath =
        'import-definition/invalid-imported-not-existing-file.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import cannot be resolved.',
        expect.any(Object),
      );
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        'Import cannot be resolved.',
        expect.any(Object),
      );
    });

    it('should diagnose error on unsupported file ending', async () => {
      const relativeTestFilePath =
        'import-definition/invalid-imported-file-with-wrong-file-ending.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import cannot be resolved.',
        expect.any(Object),
      );
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        'Import cannot be resolved.',
        expect.any(Object),
      );
    });
  });
});
