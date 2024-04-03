// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import { parseValueToInternalRepresentation } from '@jvalue/jayvee-execution';
import {
  DefaultOperatorEvaluatorRegistry,
  DefaultOperatorTypeComputerRegistry,
  EvaluationContext,
  RuntimeParameterLiteral,
  RuntimeParameterProvider,
  ValidationContext,
  WrapperFactory,
  createJayveeServices,
} from '@jvalue/jayvee-language-server';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  loadTestExtensions,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '@jvalue/jayvee-language-server/test';
import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { validateRuntimeParameterLiteral } from './runtime-parameter-literal';

describe('Validation of validateRuntimeParameterLiteral', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/',
  );

  async function parseAndValidateRuntimeParameterLiteral(
    input: string,
    runtimeParameters?: Map<string, string>,
  ) {
    const document = await parse(input);
    expectNoParserAndLexerErrors(document);

    const runtimeParameter = locator.getAstNode<RuntimeParameterLiteral>(
      document.parseResult.value,
      'pipelines@0/blocks@0/body/properties@0/value',
    ) as RuntimeParameterLiteral;

    const runtimeProvider = new RuntimeParameterProvider();
    runtimeProvider.setValueParser(parseValueToInternalRepresentation);
    if (runtimeParameters) {
      for (const [key, value] of runtimeParameters.entries()) {
        runtimeProvider.setValue(key, value);
      }
    }

    const operatorEvaluatorRegistry = new DefaultOperatorEvaluatorRegistry();
    const operatorTypeComputerRegistry =
      new DefaultOperatorTypeComputerRegistry();
    const wrapperFactory = new WrapperFactory(operatorEvaluatorRegistry);

    validateRuntimeParameterLiteral(
      runtimeParameter,
      new ValidationContext(
        validationAcceptorMock,
        operatorTypeComputerRegistry,
      ),
      new EvaluationContext(runtimeProvider, operatorEvaluatorRegistry),
      wrapperFactory,
    );
  }

  beforeAll(async () => {
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;

    await loadTestExtensions(services, [
      path.resolve(
        __dirname,
        '../../test/assets/runtime-parameter-literal/test-extension/TestBlockTypes.jv',
      ),
    ]);
    locator = services.workspace.AstNodeLocator;

    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('should diagnose no error on valid runtime parameter value', async () => {
    const text = readJvTestAsset(
      'runtime-parameter-literal/valid-text-runtime-property.jv',
    );

    await parseAndValidateRuntimeParameterLiteral(
      text,
      new Map([['TEXT_ENV', 'Value 1']]),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should diagnose error on failed runtime parameter value parsing', async () => {
    const text = readJvTestAsset(
      'runtime-parameter-literal/valid-integer-runtime-property.jv',
    );

    await parseAndValidateRuntimeParameterLiteral(
      text,
      new Map([['INTEGER_ENV', 'Value 1']]),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Unable to parse the value "Value 1" as integer.`,
      expect.any(Object),
    );
  });

  it('should diagnose error on missing runtime parameter value', async () => {
    const text = readJvTestAsset(
      'runtime-parameter-literal/valid-text-runtime-property.jv',
    );

    await parseAndValidateRuntimeParameterLiteral(text);

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `A value needs to be provided by adding "-e TEXT_ENV=<value>" to the command.`,
      expect.any(Object),
    );
  });
});
