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
        'import-definition/invalid-imported-file-with-wrong-file-ending.jv';

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
        'import-definition/invalid-dependency-cycle-1.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import from "./invalid-dependency-cycle-2.jv" leads to import cycle.',
        expect.any(Object),
      );
    });

    it('should diagnose error on cyclic import when importing itself', async () => {
      const relativeTestFilePath =
        'import-definition/invalid-dependency-cycle-self-import.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import from "./invalid-dependency-cycle-self-import.jv" leads to import cycle.',
        expect.any(Object),
      );
    });

    it('should diagnose error on cyclic import even when cycle resides in imported file', async () => {
      const relativeTestFilePath =
        'import-definition/invalid-dependency-cycle-transitive-1.jv';

      await parseAndValidateImportDefinition(relativeTestFilePath);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'Import from "./invalid-dependency-cycle-2.jv" leads to import cycle.',
        expect.any(Object),
      );
    });
  });
});
