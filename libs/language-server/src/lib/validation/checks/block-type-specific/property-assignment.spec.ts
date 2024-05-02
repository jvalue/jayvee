// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AstNode,
  type AstNodeLocator,
  type LangiumDocument,
} from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  type JayveeServices,
  type PropertyBody,
  type PropertySpecification,
  type TypedObjectWrapper,
  createJayveeServices,
} from '../../..';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../../test';

import { checkBlockTypeSpecificProperties } from './property-assignment';

describe('Validation of block type specific properties', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;
  let services: JayveeServices;

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

    const props = createJayveeValidationProps(validationAcceptorMock, services);
    const wrapper = props.wrapperFactories.TypedObject.wrap(
      propertyBody.$container.type,
    );
    expect(wrapper).toBeDefined();

    propertyBody.properties.forEach((propertyAssignment) => {
      const propertySpec = (
        wrapper as TypedObjectWrapper
      ).getPropertySpecification(propertyAssignment.name);
      expect(propertySpec).toBeDefined();

      checkBlockTypeSpecificProperties(
        propertyAssignment,
        propertySpec as PropertySpecification,
        props,
      );
    });
  }

  beforeAll(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  describe('ArchiveInterpreter block type', () => {
    it('should diagnose no error on valid archiveType parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/archive-interpreter/valid-valid-archivetype-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on invalid archiveType parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/archive-interpreter/invalid-invalid-archivetype-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'The value of property "archiveType" must be one of the following values: "zip", "gz"',
        expect.any(Object),
      );
    });
  });

  describe('CellWriter block type', () => {
    it('should diagnose error on wrong dimension for at parameter', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/cell-writer/invalid-wrong-at-dimension.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'The cell range needs to be one-dimensional',
        expect.any(Object),
      );
    });

    it('should diagnose no error on correct dimension for at parameter', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/cell-writer/valid-one-dimensional-at-value.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('ColumnDeleter block type', () => {
    it('should diagnose error on deleting partial column', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/column-deleter/invalid-partial-column-delete.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'An entire column needs to be selected',
        expect.any(Object),
      );
    });

    it('should diagnose no error', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/column-deleter/valid-column-delete.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('GtfsRTInterpreter block type', () => {
    it('should diagnose no error on valid entity parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/gtfs-rt-interpreter/valid-valid-entity-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on invalid entity parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/gtfs-rt-interpreter/invalid-invalid-entity-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'The value of property "entity" must be one of the following values: "trip_update", "alert", "vehicle"',
        expect.any(Object),
      );
    });
  });

  describe('HttpExtractor block type', () => {
    it('should diagnose no error on valid retries parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/http-extractor/valid-valid-retries-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on invalid retries parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/http-extractor/invalid-invalid-retries-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'The value of property "retries" must not be smaller than 0',
        expect.any(Object),
      );
    });

    it('should diagnose no error on valid retryBackoffMilliseconds parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/http-extractor/valid-valid-retryBackoffMilliseconds-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on invalid retryBackoffMilliseconds parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/http-extractor/invalid-invalid-retryBackoffMilliseconds-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'The value of property "retryBackoffMilliseconds" must not be smaller than 1000',
        expect.any(Object),
      );
    });

    it('should diagnose no error on valid retryBackoffStrategy parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/http-extractor/valid-valid-retryBackoffStrategy-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on invalid retryBackoffStrategy parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/http-extractor/invalid-invalid-retryBackoffStrategy-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'The value of property "retryBackoffStrategy" must be one of the following values: "exponential", "linear"',
        expect.any(Object),
      );
    });
  });

  describe('LocalFileExtractor block type', () => {
    it('should diagnose no error on valid filePath parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/local-file-extractor/valid-valid-filepath-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on invalid filePath parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/local-file-extractor/invalid-invalid-filepath-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'File path cannot include "..". Path traversal is restricted.',
        expect.any(Object),
      );
    });
  });

  describe('RowDeleter block type', () => {
    it('should diagnose error on deleting partial row', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/row-deleter/invalid-partial-row-delete.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'An entire row needs to be selected',
        expect.any(Object),
      );
    });

    it('should diagnose no error', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/row-deleter/valid-row-delete.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('TableInterpreter block type', () => {
    it('should diagnose error on non unique column names', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/table-interpreter/invalid-non-unique-column-names.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        1,
        'error',
        'The column name "name" needs to be unique.',
        expect.any(Object),
      );
      expect(validationAcceptorMock).toHaveBeenNthCalledWith(
        2,
        'error',
        'The column name "name" needs to be unique.',
        expect.any(Object),
      );
    });

    it('should diagnose no error', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/table-interpreter/valid-correct-table.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('TextFileInterpreter block type', () => {
    it('should diagnose no error on valid encoding parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/text-file-interpreter/valid-utf8-encoding-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on invalid encoding parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/text-file-interpreter/invalid-invalid-encoding-param.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'The value of property "encoding" must be one of the following values: "utf8", "ibm866", "latin2", "latin3", "latin4", "cyrillic", "arabic", "greek", "hebrew", "logical", "latin6", "utf-16"',
        expect.any(Object),
      );
    });
  });

  describe('TextLineDeleter block type', () => {
    it('should diagnose no error on valid lines parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/text-line-deleter/valid-postive-line-number.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on invalid lines parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/text-line-deleter/invalid-line-less-or-equal-zero.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(3);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'Line numbers need to be greater than zero',
        expect.any(Object),
      );
    });
  });

  describe('TextRangeSelector block type', () => {
    it('should diagnose no error on valid lineFrom parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/text-range-selector/valid-postive-lineFrom-number.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on invalid lineFrom parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/text-range-selector/invalid-lineFrom-less-or-equal-zero.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'The value of property "lineFrom" must not be smaller than 1',
        expect.any(Object),
      );
    });

    it('should diagnose no error on valid lineTo parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/text-range-selector/valid-postive-lineTo-number.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('should diagnose error on invalid lineTo parameter value', async () => {
      const text = readJvTestAsset(
        'property-assignment/block-type-specific/text-range-selector/invalid-lineTo-less-or-equal-zero.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        'The value of property "lineTo" must not be smaller than 1',
        expect.any(Object),
      );
    });
  });
});
