// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import { CachedLogger } from '@jvalue/jayvee-execution';
import {
  JayveeServices,
  createJayveeServices,
  useExtension,
} from '@jvalue/jayvee-language-server';
import {
  ParseHelperOptions,
  TestLangExtension,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { extractDocumentFromFile, validateDocument } from './parsing-util';

describe('Validation of parsing-util', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let exitSpy: jest.SpyInstance;

  let services: JayveeServices;

  const logger = new CachedLogger(true, undefined, false);

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/parsing-util/',
  );

  beforeAll(() => {
    // Mock Process.exit
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((code?: number) => {
        if (code === undefined || code === 0) {
          return undefined as never;
        }
        throw new Error(`process.exit: ${code}`);
      });

    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    exitSpy.mockClear();
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

      expect(exitSpy).toHaveBeenCalledTimes(0);
      expect(logger.getLogs().info).toHaveLength(0);
      expect(logger.getLogs().error).toHaveLength(0);
      expect(logger.getLogs().debug).toHaveLength(0);
      expect(logger.getLogs().hint).toHaveLength(0);
      expect(logger.getLogs().warning).toHaveLength(0);
    });

    it('should diagnose error on wrong loader type', async () => {
      const text = readJvTestAsset(
        'validateDocument/invalid-wrong-loader-type.jv',
      );

      try {
        await parseAndValidateDocument(text);
      } catch (e) {
        expect(exitSpy).toHaveBeenCalledTimes(1);
        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(logger.getLogs().info).toHaveLength(0);
        expect(logger.getLogs().error).toHaveLength(2 * 5); // 2 calls that get formated to 5 lines each
        expect(logger.getLogs().debug).toHaveLength(0);
        expect(logger.getLogs().hint).toHaveLength(0);
        expect(logger.getLogs().warning).toHaveLength(0);
      }
    });

    it('should diagnose no error on nonErr diagnostics', async () => {
      const text = readJvTestAsset(
        'validateDocument/valid-simplify-warning.jv',
      );

      try {
        await parseAndValidateDocument(text);
      } catch (e) {
        expect(exitSpy).toHaveBeenCalledTimes(1);
        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(logger.getLogs().info).toHaveLength(0);
        expect(logger.getLogs().error).toHaveLength(1);
        expect(logger.getLogs().debug).toHaveLength(0);
        expect(logger.getLogs().hint).toHaveLength(0);
        expect(logger.getLogs().warning).toHaveLength(0);
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

      expect(exitSpy).toHaveBeenCalledTimes(0);
      expect(logger.getLogs().info).toHaveLength(0);
      expect(logger.getLogs().error).toHaveLength(0);
      expect(logger.getLogs().debug).toHaveLength(0);
      expect(logger.getLogs().hint).toHaveLength(0);
      expect(logger.getLogs().warning).toHaveLength(0);
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
        expect(exitSpy).toHaveBeenCalledTimes(1);
        expect(logger.getLogs().info).toHaveLength(0);
        expect(logger.getLogs().error).toHaveLength(1);
        expect(logger.getLogs().error[0]).toEqual(
          expect.stringContaining(
            'Please choose a file with this extension: ".jv"',
          ),
        );
        expect(logger.getLogs().debug).toHaveLength(0);
        expect(logger.getLogs().hint).toHaveLength(0);
        expect(logger.getLogs().warning).toHaveLength(0);
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
        expect(exitSpy).toHaveBeenCalledTimes(1);
        expect(logger.getLogs().info).toHaveLength(0);
        expect(logger.getLogs().error).toHaveLength(1);
        expect(logger.getLogs().error[0]).toMatch(
          // eslint-disable-next-line no-useless-escape
          /File [\w\-\/]*\/libs\/interpreter-lib\/test\/assets\/parsing-util\/extractDocumentFromFile\/invalid-missing-file\.jv does not exist\./,
        );
        expect(logger.getLogs().debug).toHaveLength(0);
        expect(logger.getLogs().hint).toHaveLength(0);
        expect(logger.getLogs().warning).toHaveLength(0);
      }
    });
  });
});