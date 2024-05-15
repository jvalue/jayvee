// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import { CachedLogger, DiagnosticSeverity } from '@jvalue/jayvee-execution';
import {
  type JayveeServices,
  createJayveeServices,
  initializeWorkspace,
} from '@jvalue/jayvee-language-server';
import {
  expectNoParserAndLexerErrors,
  parseTestFileInWorkingDir,
} from '@jvalue/jayvee-language-server/test';
import { NodeFileSystem } from 'langium/node';

import { extractDocumentFromFile, validateDocument } from './parsing-util';

describe('Validation of parsing-util', () => {
  const WORKING_DIR = path.resolve(__dirname, '../test/assets/parsing-util/');
  let services: JayveeServices;

  const logger = new CachedLogger(true, undefined, false);

  beforeAll(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
  });

  afterEach(() => {
    logger.clearLogs();
  });

  describe('Function of validateDocument', () => {
    async function parseAndValidateDocument(relativeTestFilePath: string) {
      const document = await parseTestFileInWorkingDir(
        WORKING_DIR,
        relativeTestFilePath,
        services,
      );
      expectNoParserAndLexerErrors(document);

      return validateDocument(document, services, logger);
    }

    it('should diagnose no error on valid document', async () => {
      const relativeTestFilePath = 'validateDocument/valid-document.jv';

      await parseAndValidateDocument(relativeTestFilePath);

      expect(logger.getLogs(DiagnosticSeverity.ERROR)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.INFO)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.DEBUG)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.HINT)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.WARNING)).toHaveLength(0);
    });

    it('should diagnose error on wrong loader type', async () => {
      const relativeTestFilePath =
        'validateDocument/invalid-wrong-loader-type.jv';

      try {
        await parseAndValidateDocument(relativeTestFilePath);
      } catch (e) {
        expect(logger.getLogs(DiagnosticSeverity.INFO)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.ERROR)).toHaveLength(2 * 5); // 2 calls that get formated to 5 lines each
        expect(logger.getLogs(DiagnosticSeverity.DEBUG)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.HINT)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.WARNING)).toHaveLength(0);
      }
    });

    it('should diagnose no error on nonErr diagnostics', async () => {
      const relativeTestFilePath = 'validateDocument/valid-simplify-warning.jv';

      try {
        await parseAndValidateDocument(relativeTestFilePath);
      } catch (e) {
        expect(logger.getLogs(DiagnosticSeverity.INFO)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.ERROR)).toHaveLength(1);
        expect(logger.getLogs(DiagnosticSeverity.DEBUG)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.HINT)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.WARNING)).toHaveLength(0);
      }
    });
  });

  describe('Function of extractDocumentFromFile', () => {
    beforeAll(async () => {
      // register test extension dir as not below test files
      await initializeWorkspace(services, [
        {
          name: 'testExtension',
          uri: WORKING_DIR,
        },
      ]);
    });

    it('should diagnose no error on valid model file', async () => {
      await extractDocumentFromFile(
        path.resolve(
          __dirname,
          '../test/assets/parsing-util/',
          'extractDocumentFromFile/valid-model.jv',
        ),
        services,
        logger,
      );

      expect(logger.getLogs(DiagnosticSeverity.INFO)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.ERROR)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.DEBUG)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.HINT)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.WARNING)).toHaveLength(0);
    });

    it('should diagnose error on invalid extension', async () => {
      try {
        await extractDocumentFromFile(
          path.resolve(
            __dirname,
            '../test/assets/parsing-util/',
            'extractDocumentFromFile/invalid-extension.lv',
          ),
          services,
          logger,
        );
      } catch (e) {
        expect(logger.getLogs(DiagnosticSeverity.INFO)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.ERROR)).toHaveLength(1);
        expect(logger.getLogs(DiagnosticSeverity.ERROR)[0]?.message).toEqual(
          expect.stringContaining(
            'Please choose a file with this extension: ".jv"',
          ),
        );
        expect(logger.getLogs(DiagnosticSeverity.DEBUG)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.HINT)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.WARNING)).toHaveLength(0);
      }
    });

    it('should diagnose error on missing file', async () => {
      try {
        await extractDocumentFromFile(
          path.resolve(
            __dirname,
            '../test/assets/parsing-util/',
            'extractDocumentFromFile/invalid-missing-file.jv',
          ),
          services,
          logger,
        );
      } catch (e) {
        expect(logger.getLogs(DiagnosticSeverity.INFO)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.ERROR)).toHaveLength(1);
        expect(logger.getLogs(DiagnosticSeverity.ERROR)[0]?.message).toMatch(
          // eslint-disable-next-line no-useless-escape
          /File [\w\-\/]*\/libs\/interpreter-lib\/test\/assets\/parsing-util\/extractDocumentFromFile\/invalid-missing-file\.jv does not exist\./,
        );
        expect(logger.getLogs(DiagnosticSeverity.DEBUG)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.HINT)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.WARNING)).toHaveLength(0);
      }
    });
  });
});
