// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  EvaluationContext,
  PropertyBody,
  RuntimeParameterProvider,
  ValidationContext,
  createJayveeServices,
  getTypedObjectWrapper,
} from '../../..';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../../test';

import { checkBlocktypeSpecificPropertyBody } from './property-body';

describe('Validation of blocktype specific property bodies', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../../test/assets/',
  );

  async function parseAndValidatePropertyAssignment(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const propertyBody = locator.getAstNode<PropertyBody>(
      document.parseResult.value,
      'pipelines@0/blocks@0/body',
    ) as PropertyBody;

    const wrapper = getTypedObjectWrapper(propertyBody.$container.type);
    expect(wrapper).toBeDefined();

    checkBlocktypeSpecificPropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
      new EvaluationContext(new RuntimeParameterProvider()),
    );
  }

  beforeAll(() => {
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  describe('TextRangeSelector blocktype', () => {
    it('should diagnose error on lineFrom > lineTo', async () => {
      const text = readJvTestAsset(
        'property-body/blocktype-specific/text-range-selector/invalid-lineFrom-greater-lineTo.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'The lower line number needs to be smaller or equal to the upper line number',
        expect.any(Object),
      );
    });

    it('should diagnose no error', async () => {
      const text = readJvTestAsset(
        'property-body/blocktype-specific/text-range-selector/valid-correct-range.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('CellWriter blocktype', () => {
    it('should diagnose error on number of write values does not match cell range', async () => {
      const text = readJvTestAsset(
        'property-body/blocktype-specific/cell-writer/invalid-write-length-does-not-match-cell-range.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'warning',
        'The number of values to write (3) does not match the number of cells (4)',
        expect.any(Object),
      );
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'warning',
        'The number of values to write (3) does not match the number of cells (4)',
        expect.any(Object),
      );
    });

    it('should diagnose no error', async () => {
      const text = readJvTestAsset(
        'property-body/blocktype-specific/cell-writer/valid-range-matches-array-length.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('TableTransformer blocktype', () => {
    it('should diagnose error on number of input columns do not match transform input ports', async () => {
      const text = readJvTestAsset(
        'property-body/blocktype-specific/table-transformer/invalid-input-columns-transform-port-missmatch.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'Expected 1 columns but only got 2',
        expect.any(Object),
      );
    });

    it('should diagnose no error', async () => {
      const text = readJvTestAsset(
        'property-body/blocktype-specific/table-transformer/valid-correct-ports.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });
  });
});
