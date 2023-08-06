// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  EvaluationContext,
  RuntimeParameterProvider,
  ValidationContext,
  ValuetypeDefinition,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';
import { TestLangExtension } from '../../../test/extension';

import { validateValuetypeDefinition } from './valuetype-definition';

describe('Validation of ValuetypeDefinition', () => {
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

  async function parseAndValidateValuetypeDefinition(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const valuetypeDefinition = locator.getAstNode<ValuetypeDefinition>(
      document.parseResult.value,
      'valuetypes@0',
    ) as ValuetypeDefinition;

    validateValuetypeDefinition(
      valuetypeDefinition,
      new ValidationContext(validationAcceptorMock),
      new EvaluationContext(new RuntimeParameterProvider()),
    );
  }

  beforeAll(() => {
    // Register test extension
    useExtension(new TestLangExtension());
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

  it('should have no error on empty constraint list', async () => {
    const text = readJvTestAsset(
      'valuetype-definition/valid-valuetype-definition.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on supertype cycle', async () => {
    const text = readJvTestAsset(
      'valuetype-definition/invalid-supertype-cycle.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Could not construct this valuetype since there is a cycle in the (transitive) "oftype" relation.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on invalid constraints item', async () => {
    const text = readJvTestAsset(
      'valuetype-definition/invalid-invalid-constraints-item.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The value needs to be of type Collection<Constraint> but is of type Collection<boolean>`,
      expect.any(Object),
    );
  });

  it('should diagnose error on invalid constraint type for valuetype', async () => {
    const text = readJvTestAsset(
      'valuetype-definition/invalid-invalid-constraint-type-for-valuetype.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `This valuetype ValueType is not convertible to the type integer of the constraint "Constraint"`,
      expect.any(Object),
    );
  });

  it('should diagnose error on duplicate generic on valuetype', async () => {
    const text = readJvTestAsset(
      'valuetype-definition/invalid-duplicate-generic.jv',
    );

    await parseAndValidateValuetypeDefinition(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Generic parameter T is not unique`,
      expect.any(Object),
    );
  });
});
