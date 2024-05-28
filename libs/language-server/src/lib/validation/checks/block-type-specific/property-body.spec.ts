// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type JayveeServices,
  type PropertyBody,
  createJayveeServices,
  isBlockDefinition,
  isPropertyBody,
} from '../../..';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  extractTestElements,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../../test';

import { checkBlockTypeSpecificPropertyBody } from './property-body';

describe('Validation of block type specific property bodies', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../../test/assets/',
  );

  async function parseAndValidatePropertyAssignment(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const propertyBody = extractTestElements(
      document,
      (x): x is PropertyBody =>
        isPropertyBody(x) && isBlockDefinition(x.$container),
    )[0]!;

    const props = createJayveeValidationProps(validationAcceptorMock, services);

    const wrapper = props.wrapperFactories.TypedObject.wrap(
      propertyBody.$container.type,
    );
    expect(wrapper).toBeDefined();

    checkBlockTypeSpecificPropertyBody(propertyBody, props);
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

  describe('TextRangeSelector block type', () => {
    it('should diagnose error on lineFrom > lineTo', async () => {
      const text = readJvTestAsset(
        'property-body/block-type-specific/text-range-selector/invalid-lineFrom-greater-lineTo.jv',
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
        'property-body/block-type-specific/text-range-selector/valid-correct-range.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('CellWriter block type', () => {
    it('should diagnose error on number of write values does not match cell range', async () => {
      const text = readJvTestAsset(
        'property-body/block-type-specific/cell-writer/invalid-write-length-does-not-match-cell-range.jv',
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
        'property-body/block-type-specific/cell-writer/valid-range-matches-array-length.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('TableTransformer block type', () => {
    it('should diagnose error on number of input columns do not match transform input ports', async () => {
      const text = readJvTestAsset(
        'property-body/block-type-specific/table-transformer/invalid-input-columns-transform-port-missmatch.jv',
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
        'property-body/block-type-specific/table-transformer/valid-correct-ports.jv',
      );

      await parseAndValidatePropertyAssignment(text);

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });
  });
});
