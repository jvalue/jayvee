// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { BuiltinBlockTypeDefinition, createJayveeServices } from '../..';
import {
  ParseHelperOptions,
  createJayveeValidationProps,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateBlockTypeDefinition } from './blocktype-definition';

describe('Validation of BuiltinBlockTypeDefinition', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  async function parseAndValidateBlockType(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const blocktype = locator.getAstNode<BuiltinBlockTypeDefinition>(
      document.parseResult.value,
      'blocktypes@0',
    ) as BuiltinBlockTypeDefinition;

    validateBlockTypeDefinition(
      blocktype,
      createJayveeValidationProps(validationAcceptorMock),
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

  it('should diagnose error on duplicate property in block type', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/invalid-internal-blocktype-duplicate-property.jv',
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
      'builtin-blocktype-definition/invalid-internal-blocktype-multiple-inputs.jv',
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
      'builtin-blocktype-definition/invalid-internal-blocktype-multiple-outputs.jv',
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
      'builtin-blocktype-definition/invalid-internal-blocktype-no-input.jv',
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
      'builtin-blocktype-definition/invalid-internal-blocktype-no-output.jv',
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
      'builtin-blocktype-definition/invalid-internal-blocktype-wrong-property-default-value.jv',
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
      'builtin-blocktype-definition/valid-internal-blocktype-extractor.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid loader block type definition (no outputs)', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/valid-internal-blocktype-loader.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid block type definition', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/valid-internal-blocktype-no-default-prop-values.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid block type definition with default property value', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/valid-internal-blocktype-with-default-prop-values.jv',
    );

    await parseAndValidateBlockType(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
