// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import { parseValueToInternalRepresentation } from '@jvalue/jayvee-execution';
import {
  DefaultOperatorEvaluatorRegistry,
  DefaultOperatorTypeComputerRegistry,
  EvaluationContext,
  type JayveeServices,
  type RuntimeParameterLiteral,
  RuntimeParameterProvider,
  ValidationContext,
  ValueTypeProvider,
  WrapperFactoryProvider,
  createJayveeServices,
} from '@jvalue/jayvee-language-server';
import {
  type ParseHelperOptions,
  expectNoParserAndLexerErrors,
  loadTestExtensions,
  parseHelper,
  readJvTestAssetHelper,
  validationAcceptorMockImpl,
} from '@jvalue/jayvee-language-server/test';
import {
  type AstNode,
  type AstNodeLocator,
  type LangiumDocument,
} from 'langium';
import { NodeFileSystem } from 'langium/node';
import { vi } from 'vitest';

import { validateRuntimeParameterLiteral } from './runtime-parameter-literal';

describe('Validation of validateRuntimeParameterLiteral', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const validationAcceptorMock = vi.fn(validationAcceptorMockImpl);

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
    const valueTypeProvider = new ValueTypeProvider();
    const wrapperFactories = new WrapperFactoryProvider(
      operatorEvaluatorRegistry,
      valueTypeProvider,
    );
    const operatorTypeComputerRegistry =
      new DefaultOperatorTypeComputerRegistry(
        valueTypeProvider,
        wrapperFactories,
      );

    validateRuntimeParameterLiteral(runtimeParameter, {
      validationContext: new ValidationContext(
        validationAcceptorMock,
        operatorTypeComputerRegistry,
      ),
      evaluationContext: new EvaluationContext(
        runtimeProvider,
        operatorEvaluatorRegistry,
        valueTypeProvider,
      ),
      valueTypeProvider: valueTypeProvider,
      wrapperFactories: wrapperFactories,
    });
  }

  beforeAll(async () => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;

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
