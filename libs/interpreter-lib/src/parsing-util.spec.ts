// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { TestLogger } from '@jvalue/jayvee-execution/test';
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

import { extractDocumentFromString, validateDocument } from './parsing-util';

describe('Validation of parsing-util', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let exitSpy: jest.SpyInstance;

  // let locator: AstNodeLocator;
  let services: JayveeServices;

  const logger = new TestLogger(true, undefined);

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/parsing-util/',
  );

  beforeAll(() => {
    // Mock Process.exit
    exitSpy = jest
      .spyOn(process, 'exit')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .mockImplementation((code?: number) => undefined as never);

    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    // locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  /*afterEach(() => {
    logger.clearLogs();
  });*/

  describe('Validation of validateDocument', () => {
    async function parseAndValidateDocument(input: string) {
      const document = await parse(input);
      expectNoParserAndLexerErrors(document);

      return validateDocument(document, services, logger);
    }

    it('should diagnose no error on valid document', async () => {
      const text = readJvTestAsset('validateDocument/valid-document.jv');

      await parseAndValidateDocument(text);

      expect(exitSpy).toHaveBeenCalledTimes(0);
      /*expect(logger.getLogs().infoLogs).toHaveLength(0);
      expect(logger.getLogs().errorLogs).toHaveLength(0);
      expect(logger.getLogs().debugLogs).toHaveLength(0);
      expect(logger.getLogs().diagnosticLogs).toHaveLength(0);*/
    });

    it('should diagnose error on wrong loader type', async () => {
      const text = readJvTestAsset(
        'validateDocument/invalid-wrong-loader-type.jv',
      );

      await parseAndValidateDocument(text);

      expect(exitSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledWith(1);
      /*expect(logger.getLogs().infoLogs).toHaveLength(0);
      expect(logger.getLogs().errorLogs).toHaveLength(0);
      expect(logger.getLogs().debugLogs).toHaveLength(0);
      expect(logger.getLogs().diagnosticLogs).toHaveLength(2);*/
    });

    it('should diagnose no error on nonErr diagnostics', async () => {
      const text = readJvTestAsset(
        'validateDocument/invalid-wrong-loader-type.jv',
      );

      await parseAndValidateDocument(text);

      expect(exitSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledWith(1);
      /*expect(logger.getLogs().infoLogs).toHaveLength(0);
      expect(logger.getLogs().errorLogs).toHaveLength(0);
      expect(logger.getLogs().debugLogs).toHaveLength(0);
      expect(logger.getLogs().diagnosticLogs).toHaveLength(1);*/
    });
  });

  describe('Validation of extractDocumentFromString', () => {
    it('should diagnose no error on valid model string', async () => {
      const text = readJvTestAsset('extractDocumentFromString/valid-model.jv');

      await extractDocumentFromString(text, services, logger);

      expect(exitSpy).toHaveBeenCalledTimes(0);
      /*expect(logger.getLogs().infoLogs).toHaveLength(0);
      expect(logger.getLogs().errorLogs).toHaveLength(0);
      expect(logger.getLogs().debugLogs).toHaveLength(0);
      expect(logger.getLogs().diagnosticLogs).toHaveLength(0);*/
    });

    it('should diagnose error on invalid model string', async () => {
      const text = readJvTestAsset(
        'extractDocumentFromString/invalid-model.jv',
      );

      await extractDocumentFromString(text, services, logger);

      expect(exitSpy).toHaveBeenCalledTimes(1);
      /*expect(logger.getLogs().infoLogs).toHaveLength(0);
      expect(logger.getLogs().errorLogs).toHaveLength(0);
      expect(logger.getLogs().debugLogs).toHaveLength(0);
      expect(logger.getLogs().diagnosticLogs).toHaveLength(3);*/
    });
  });
});
