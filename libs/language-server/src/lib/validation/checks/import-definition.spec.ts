// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  createJayveeServices,
  isJayveeModel,
} from '../../../lib';
import {
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  parseTestFileInWorkingDir,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateImportDefinition } from './import-definition';

describe('Validation of ImportDefinition', () => {
  const WORKING_DIR = path.resolve(__dirname, '../../../test/assets/');
  let services: JayveeServices;
  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  async function parseAndValidateImportDefinition(
    relativeTestFilePath: string,
  ) {
    const document = await parseTestFileInWorkingDir(
      WORKING_DIR,
      relativeTestFilePath,
      services,
    );
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

  describe('ImportDefinition wildcard syntax', () => {
    it('should have no error if file exists in same directory', async () => {
      const relativeTestFilePath =
        'import-definition/wildcard-import/valid-imported-file-exists-same-dir.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should have no error if file exists in deeper directory', async () => {
      const relativeTestFilePath =
        'import-definition/wildcard-import/valid-imported-file-exists-deeper-dir.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should have no error if file exists in deeper directory', async () => {
      const relativeTestFilePath =
        'import-definition/wildcard-import/deeper/valid-imported-file-exists-higher-dir.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on imported file that does not exist', async () => {
      const relativeTestFilePath =
        'import-definition/wildcard-import/invalid-imported-not-existing-file.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import from "not-existing-imported-file-deeper.jv" could be resolved. Check if the file exists in the given location.',
        expect.any(Object),
      );
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        'Import from "./not-existing-imported-file-deeper.jv" could be resolved. Check if the file exists in the given location.',
        expect.any(Object),
      );
    });

    it('should diagnose error on unsupported file ending', async () => {
      const relativeTestFilePath =
        'import-definition/wildcard-import/invalid-imported-file-with-wrong-file-ending.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import from "existing-imported-file.njv" could be resolved. Check if the file exists in the given location.',
        expect.any(Object),
      );
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        'Import from "./existing-imported-file.njv" could be resolved. Check if the file exists in the given location.',
        expect.any(Object),
      );
    });

    it('should diagnose error on cyclic import', async () => {
      const relativeTestFilePath =
        'import-definition/wildcard-import/invalid-dependency-cycle-1.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import from "./invalid-dependency-cycle-2.jv" leads to import cycle: "./invalid-dependency-cycle-2.jv" -> "./invalid-dependency-cycle-1.jv" -> "./invalid-dependency-cycle-2.jv"',
        expect.any(Object),
      );
    });

    it('should diagnose error on cyclic import when importing itself', async () => {
      const relativeTestFilePath =
        'import-definition/wildcard-import/invalid-dependency-cycle-self-import.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import from "./invalid-dependency-cycle-self-import.jv" leads to import cycle: "./invalid-dependency-cycle-self-import.jv" -> "./invalid-dependency-cycle-self-import.jv"',
        expect.any(Object),
      );
    });

    it('should diagnose error on cyclic import even when cycle resides in imported file', async () => {
      const relativeTestFilePath =
        'import-definition/wildcard-import/invalid-dependency-cycle-deeper-1.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import from "./invalid-dependency-cycle-deeper-2.jv" leads to import cycle: "./invalid-dependency-cycle-deeper-2.jv" -> "./invalid-dependency-cycle-deeper-3.jv" -> "./invalid-dependency-cycle-deeper-2.jv"',
        expect.any(Object),
      );
    });

    it('should diagnose error on cyclic import spans multiple files', async () => {
      const relativeTestFilePath =
        'import-definition/wildcard-import/invalid-dependency-cycle-transitive-1.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import from "./invalid-dependency-cycle-transitive-2.jv" leads to import cycle: "./invalid-dependency-cycle-transitive-2.jv" -> "./invalid-dependency-cycle-transitive-3.jv" -> "./invalid-dependency-cycle-transitive-1.jv" -> "./invalid-dependency-cycle-transitive-2.jv"',
        expect.any(Object),
      );
    });
  });

  describe('ImportDefinition named element syntax', () => {
    it('should diagnose no error on specific element use that is published via element definition', async () => {
      const relativeTestFilePath =
        'import-definition/named-import/valid-imported-element-exists.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose no error on specific element use that is published via export definition', async () => {
      const relativeTestFilePath =
        'import-definition/named-import/valid-imported-aliased-element-exists.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on specific element use that does not exist', async () => {
      const relativeTestFilePath =
        'import-definition/named-import/invalid-imported-element-not-existing.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Could not find published element A in file "./publishing.jv". Check if the element exists and has been correctly published.',
        expect.any(Object),
      );
    });

    it('should diagnose error on specific element use that exists but is not published', async () => {
      const relativeTestFilePath =
        'import-definition/named-import/invalid-imported-element-not-published.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Could not find published element Y in file "./publishing.jv". Check if the element exists and has been correctly published.',
        expect.any(Object),
      );
    });

    it('should diagnose error on specific element being imported multiple times in one statement', async () => {
      const relativeTestFilePath =
        'import-definition/named-import/invalid-imported-element-multiple-times-same-statement.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Element X is imported 2 times from file "./publishing.jv". Remove the duplicate import.',
        expect.any(Object),
      );
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        'Element X is imported 2 times from file "./publishing.jv". Remove the duplicate import.',
        expect.any(Object),
      );
    });

    it('should diagnose error on specific file being imported multiple times', async () => {
      const relativeTestFilePath =
        'import-definition/named-import/invalid-imported-file-multiple-times.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Found 2 import statements for file "./publishing.jv". Combine both import statements.',
        expect.any(Object),
      );
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        'Found 2 import statements for file "publishing.jv". Combine both import statements.',
        expect.any(Object),
      );
    });
  });
});
