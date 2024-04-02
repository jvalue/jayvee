// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  BuiltinBlocktypeDefinition,
  DefaultExpressionEvaluatorRegistry,
  DefaultTypeComputerRegistry,
  EvaluationContext,
  RuntimeParameterProvider,
  ValidationContext,
  createJayveeServices,
} from '../..';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';

import { validateBlocktypeDefinition } from './blocktype-definition';

describe('Validation of BuiltinBlocktypeDefinition', () => {
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

  async function parseAndValidateBlocktype(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const blocktype = locator.getAstNode<BuiltinBlocktypeDefinition>(
      document.parseResult.value,
      'blocktypes@0',
    ) as BuiltinBlocktypeDefinition;

    validateBlocktypeDefinition(
      blocktype,
      new ValidationContext(
        validationAcceptorMock,
        new DefaultTypeComputerRegistry(),
      ),
      new EvaluationContext(
        new RuntimeParameterProvider(),
        new DefaultExpressionEvaluatorRegistry(),
      ),
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

  it('should diagnose error on duplicate property in blocktype', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/invalid-internal-blocktype-duplicate-property.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Property 'testProp' in blocktype 'TestBlock' is defined multiple times`,
      expect.any(Object),
    );
  });

  it('should diagnose error on multiple inputs in blocktype', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/invalid-internal-blocktype-multiple-inputs.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Found more than one input definition in blocktype 'TestBlock'`,
      expect.any(Object),
    );
  });

  it('should diagnose error on multiple outputs in blocktype', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/invalid-internal-blocktype-multiple-outputs.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Found more than one output definition in blocktype 'TestBlock'`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing input', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/invalid-internal-blocktype-no-input.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Found no input in blocktype 'TestBlock' - consider using iotype "none" if the blocktype consumes no input`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing output', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/invalid-internal-blocktype-no-output.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Found no output in blocktype 'TestBlock' - consider using iotype "none" if the blocktype produces no output`,
      expect.any(Object),
    );
  });

  it('should diagnose error on neither inputs nor outputs', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/invalid-internal-blocktype-wrong-property-default-value.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `This default value is not compatible with valuetype decimal`,
      expect.any(Object),
    );
  });

  it('should have no error on valid extractor blocktype definition (no inputs)', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/valid-internal-blocktype-extractor.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid loader blocktype definition (no outputs)', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/valid-internal-blocktype-loader.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid blocktype definition', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/valid-internal-blocktype-no-default-prop-values.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on valid blocktype definition with default property value', async () => {
    const text = readJvTestAsset(
      'builtin-blocktype-definition/valid-internal-blocktype-with-default-prop-values.jv',
    );

    await parseAndValidateBlocktype(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });
});
