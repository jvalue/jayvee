// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import { CachedLogger, DiagnosticSeverity } from '@jvalue/jayvee-execution';
import {
  type JayveeServices,
  createJayveeServices,
} from '@jvalue/jayvee-language-server';
import {
  type ParseHelperOptions,
  expectNoParserAndLexerErrors,
  loadTestExtensions,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { extractDocumentFromFile, validateDocument } from './parsing-util';

describe('Validation of parsing-util', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let services: JayveeServices;

  const logger = new CachedLogger(true, undefined, false);

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/parsing-util/',
  );

  beforeAll(async () => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;

    await loadTestExtensions(services, [
      path.resolve(
        __dirname,
        '../test/assets/parsing-util/test-extension/TestBlockTypes.jv',
      ),
    ]);

    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    logger.clearLogs();
  });

  describe('Function of validateDocument', () => {
    async function parseAndValidateDocument(input: string) {
      const document = await parse(input);
      expectNoParserAndLexerErrors(document);

      return validateDocument(document, services, logger);
    }

    it('should diagnose no error on valid document', async () => {
      const text = readJvTestAsset('validateDocument/valid-document.jv');

      await parseAndValidateDocument(text);

      expect(logger.getLogs(DiagnosticSeverity.ERROR)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.INFO)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.DEBUG)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.HINT)).toHaveLength(0);
      expect(logger.getLogs(DiagnosticSeverity.WARNING)).toHaveLength(0);
    });

    it('should diagnose error on wrong loader type', async () => {
      const text = readJvTestAsset(
        'validateDocument/invalid-wrong-loader-type.jv',
      );

      try {
        await parseAndValidateDocument(text);
      } catch (e) {
        expect(logger.getLogs(DiagnosticSeverity.INFO)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.ERROR)).toHaveLength(2 * 5); // 2 calls that get formated to 5 lines each
        expect(logger.getLogs(DiagnosticSeverity.DEBUG)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.HINT)).toHaveLength(0);
        expect(logger.getLogs(DiagnosticSeverity.WARNING)).toHaveLength(0);
      }
    });

    it('should diagnose no error on nonErr diagnostics', async () => {
      const text = readJvTestAsset(
        'validateDocument/valid-simplify-warning.jv',
      );

      try {
        await parseAndValidateDocument(text);
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
