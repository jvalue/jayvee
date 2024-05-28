// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BlockDefinition,
  type InternalValueRepresentation,
  type JayveeServices,
  type TypedConstraintDefinition,
  createJayveeServices,
  isTypedConstraintDefinition,
} from '@jvalue/jayvee-language-server';
import {
  type ParseHelperOptions,
  expectNoParserAndLexerErrors,
  extractTestElements,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import {
  type AstNode,
  type AstNodeLocator,
  type LangiumDocument,
} from 'langium';
import { NodeFileSystem } from 'langium/node';

import { getTestExecutionContext } from '../../../../test/utils';

import { LengthConstraintExecutor } from './length-constraint-executor';

describe('Validation of LengthConstraintExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../../test/assets/',
  );

  async function parseAndValidateConstraint(
    input: string,
    value: InternalValueRepresentation,
  ): Promise<boolean> {
    const document = await parse(input, { validation: true });
    expectNoParserAndLexerErrors(document);

    const usageBlock = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@2',
    ) as BlockDefinition;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const constraint = extractTestElements(
      document,
      (x): x is TypedConstraintDefinition => isTypedConstraintDefinition(x),
    )[0]!;

    return new LengthConstraintExecutor().isValid(
      value,
      // Execution context with initial stack containing usage block of constraint and constraint itself
      getTestExecutionContext(locator, document, services, [
        usageBlock,
        constraint,
      ]),
    );
  }

  beforeAll(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  it('should diagnose no error on valid value', async () => {
    const text = readJvTestAsset(
      'length-constraint-executor/valid-constraint.jv',
    );

    const valid = await parseAndValidateConstraint(text, 'tt');

    expect(valid).toBe(true);
  });

  it('should diagnose error on invalid value', async () => {
    const text = readJvTestAsset(
      'length-constraint-executor/valid-constraint.jv',
    );

    const valid = await parseAndValidateConstraint(text, 'ttttt');

    expect(valid).toBe(false);
  });

  it('should work with only a lower bound specified', async () => {
    const text = readJvTestAsset(
      'length-constraint-executor/only-lower-bound.jv',
    );

    const valid = await parseAndValidateConstraint(text, 'morethan2chars');

    expect(valid).toBe(true);
  });

  it('should work with only an uppper bound specified', async () => {
    const text = readJvTestAsset(
      'length-constraint-executor/only-upper-bound.jv',
    );

    const valid = await parseAndValidateConstraint(text, '');

    expect(valid).toBe(true);
  });
});
