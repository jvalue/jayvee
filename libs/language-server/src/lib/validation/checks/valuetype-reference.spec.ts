// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  ValidationContext,
  ValuetypeDefinition,
  ValuetypeReference,
  createJayveeServices,
  useExtension,
} from '../..';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '../../../test';
import { TestLangExtension } from '../../../test/extension';

import { validateValuetypeReference } from './valuetype-reference';

describe('Validation of ValuetypeReference', () => {
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

  async function parseValuetypeReferencesFromValuetypes(input: string) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const valuetypeReferences: ValuetypeReference[] = [];

    let valuetypeDefinition: ValuetypeDefinition | undefined;
    let i = 0;
    do {
      valuetypeDefinition = locator.getAstNode<ValuetypeDefinition>(
        document.parseResult.value,
        `valuetypes@${i}`,
      );
      if (valuetypeDefinition !== undefined) {
        const valuetypeRef = valuetypeDefinition.type;
        assert(valuetypeRef !== undefined);
        valuetypeReferences.push(valuetypeRef);
      }
      ++i;
    } while (valuetypeDefinition !== undefined);

    return valuetypeReferences;
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

  it('should have no error on reference to non-generic valuetype', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/valid-reference-to-non-generic-valuetype.jv',
    );

    (await parseValuetypeReferencesFromValuetypes(text)).forEach(
      (valuetypeRef) => {
        validateValuetypeReference(
          valuetypeRef,
          new ValidationContext(validationAcceptorMock),
        );
      },
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on reference to generic valuetype with single generic', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/valid-reference-to-single-generic-valuetype.jv',
    );

    (await parseValuetypeReferencesFromValuetypes(text)).forEach(
      (valuetypeRef) => {
        validateValuetypeReference(
          valuetypeRef,
          new ValidationContext(validationAcceptorMock),
        );
      },
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error on reference to generic valuetype with multiple generics', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/valid-reference-to-multiple-generic-valuetype.jv',
    );

    (await parseValuetypeReferencesFromValuetypes(text)).forEach(
      (valuetypeRef) => {
        validateValuetypeReference(
          valuetypeRef,
          new ValidationContext(validationAcceptorMock),
        );
      },
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on reference to generic valuetype with missing generic parameters', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/invalid-reference-missing-generic.jv',
    );

    (await parseValuetypeReferencesFromValuetypes(text)).forEach(
      (valuetypeRef) => {
        validateValuetypeReference(
          valuetypeRef,
          new ValidationContext(validationAcceptorMock),
        );
      },
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The referenced valuetype ValueType requires 2 generic parameters but found 0.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on reference to generic valuetype with too few generic parameters', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/invalid-reference-too-few-generic-parameters.jv',
    );

    (await parseValuetypeReferencesFromValuetypes(text)).forEach(
      (valuetypeRef) => {
        validateValuetypeReference(
          valuetypeRef,
          new ValidationContext(validationAcceptorMock),
        );
      },
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The referenced valuetype ValueType requires 2 generic parameters but found 1.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on reference to generic valuetype with too few generic parameters', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/invalid-reference-too-many-generic-parameters.jv',
    );

    (await parseValuetypeReferencesFromValuetypes(text)).forEach(
      (valuetypeRef) => {
        validateValuetypeReference(
          valuetypeRef,
          new ValidationContext(validationAcceptorMock),
        );
      },
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The referenced valuetype ValueType requires 2 generic parameters but found 3.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on reference to non-generic valuetype with generic parameters', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/invalid-reference-too-non-generic-with-generic-parameters.jv',
    );

    (await parseValuetypeReferencesFromValuetypes(text)).forEach(
      (valuetypeRef) => {
        validateValuetypeReference(
          valuetypeRef,
          new ValidationContext(validationAcceptorMock),
        );
      },
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The referenced valuetype ValueType requires 0 generic parameters but found 1.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on reference to non-referenceable valuetype', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/invalid-reference-to-non-referenceable-valuetype-in-valuetype.jv',
    );

    (await parseValuetypeReferencesFromValuetypes(text)).forEach(
      (valuetypeRef) => {
        validateValuetypeReference(
          valuetypeRef,
          new ValidationContext(validationAcceptorMock),
        );
      },
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(2);
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      1,
      'error',
      `Valuetype Constraint cannot be referenced in this context`,
      expect.any(Object),
    );
    expect(validationAcceptorMock).toHaveBeenNthCalledWith(
      2,
      'error',
      `Valuetype Regex cannot be referenced in this context`,
      expect.any(Object),
    );
  });

  it('should diagnose error on reference to non-referenceable valuetype in a block', async () => {
    const text = readJvTestAsset(
      'valuetype-reference/invalid-reference-to-non-referenceable-valuetype-in-block.jv',
    );

    const document = await parse(text);
    expectNoParserAndLexerErrors(document);
    const valuetypeRef = locator.getAstNode<ValuetypeReference>(
      document.parseResult.value,
      `pipelines@0/blocks@0/body/properties@0/value/values@0/value/type`,
    );
    assert(valuetypeRef !== undefined);

    validateValuetypeReference(
      valuetypeRef,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Valuetype Constraint cannot be referenced in this context`,
      expect.any(Object),
    );
  });
});
