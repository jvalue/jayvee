// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import {
  type BuiltinBlockTypeDefinition,
  type JayveeServices,
  createJayveeServices,
  isBuiltinBlockTypeDefinition,
} from '../..';
import {
  type ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  extractTestElements,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateBlockTypeDefinition } from './block-type-definition';

describe('Validation of BuiltinBlockTypeDefinition', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidateBlockType(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const allBlockTypes = extractTestElements(
      document,
      (x): x is BuiltinBlockTypeDefinition => isBuiltinBlockTypeDefinition(x),
    );

    for (const blockType of allBlockTypes) {
      validateBlockTypeDefinition(
        blockType,
        createJayveeValidationProps(validationAcceptorMock, services),
      );
    }
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

  it('should diagnose error on duplicate property in block type', async () => {
    const text = readJvTestAsset(
      'builtin-block-type-definition/invalid-internal-block-type-duplicate-property.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Property 'testProp' in block type 'TestBlock' is defined multiple times`,
      expect.any(Object),
    );
  });

  it('should diagnose error on multiple inputs in block type', async () => {
    const text = readJvTestAsset(
      'builtin-block-type-definition/invalid-internal-block-type-multiple-inputs.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Found more than one input definition in block type 'TestBlock'`,
      expect.any(Object),
    );
  });

  it('should diagnose error on multiple outputs in block type', async () => {
    const text = readJvTestAsset(
      'builtin-block-type-definition/invalid-internal-block-type-multiple-outputs.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Found more than one output definition in block type 'TestBlock'`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing input', async () => {
    const text = readJvTestAsset(
      'builtin-block-type-definition/invalid-internal-block-type-no-input.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Found no input in block type 'TestBlock' - consider using iotype "none" if the block type consumes no input`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing output', async () => {
    const text = readJvTestAsset(
      'builtin-block-type-definition/invalid-internal-block-type-no-output.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Found no output in block type 'TestBlock' - consider using iotype "none" if the block type produces no output`,
      expect.any(Object),
    );
  });

  it('should diagnose error on neither inputs nor outputs', async () => {
    const text = readJvTestAsset(
      'builtin-block-type-definition/invalid-internal-block-type-wrong-property-default-value.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `This default value is not compatible with value type decimal`,
      expect.any(Object),
    );
  });

  it('should have no error on valid extractor block type definition (no inputs)', async () => {
    const text = readJvTestAsset(
      'builtin-block-type-definition/valid-internal-block-type-extractor.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid loader block type definition (no outputs)', async () => {
    const text = readJvTestAsset(
      'builtin-block-type-definition/valid-internal-block-type-loader.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid block type definition', async () => {
    const text = readJvTestAsset(
      'builtin-block-type-definition/valid-internal-block-type-no-default-prop-values.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid block type definition with default property value', async () => {
    const text = readJvTestAsset(
      'builtin-block-type-definition/valid-internal-block-type-with-default-prop-values.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
