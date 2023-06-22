// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockDefinition,
  BlockMetaInformation,
  JayveeServices,
  createJayveeServices,
  useExtension,
} from '@jvalue/jayvee-language-server';
import {
  ParseHelperOptions,
  TestLangExtension,
  ValidationResult,
  expectNoParserAndLexerErrors,
  getTestExtensionBlockForIOType,
  parseHelper,
  validationHelper,
} from '@jvalue/jayvee-language-server/test';
import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { StdLangExtension } from './extension';

describe('Validation of builtin examples of BlockMetaInformation', () => {
  let services: JayveeServices;
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;
  let validate: (input: string) => Promise<ValidationResult<AstNode>>;

  let locator: AstNodeLocator;

  const testExtension = new TestLangExtension();
  const stdExtension = new StdLangExtension();

  async function generateFullJvExample(
    blockMetaInf: BlockMetaInformation,
    blockExample: string,
  ): Promise<string> {
    // Get name of block in example
    const parsedExample = await parse(`pipeline Test {${blockExample}}`);
    expectNoParserAndLexerErrors(parsedExample);
    const blockName: string = (
      locator.getAstNode<BlockDefinition>(
        parsedExample.parseResult.value,
        'pipelines@0/blocks@0',
      ) as BlockDefinition
    ).name;

    let pipelineContent = `${blockExample}`;
    // Generate extractor block and pipe
    if (blockMetaInf.hasInput()) {
      // Get Extractor block for this blockMetaInf.inputType
      const inputBlockMetaInf = getTestExtensionBlockForIOType(
        testExtension,
        blockMetaInf.inputType,
        'output',
      );
      // Generate block
      const extractorBlock = `block TestExtractorBlock oftype ${inputBlockMetaInf.type} {}`;
      // generate pipe
      const pipe = `TestExtractorBlock -> ${blockName};`;
      pipelineContent += `\n${extractorBlock}\n${pipe}`;
    }
    // Generate loader block and pipe
    if (blockMetaInf.hasOutput()) {
      // Get Loader block for this blockMetaInf.outputType
      const outputBlockMetaInf = getTestExtensionBlockForIOType(
        testExtension,
        blockMetaInf.outputType,
        'input',
      );
      // Generate block
      const loaderBlock = `block TestLoaderBlock oftype ${outputBlockMetaInf.type} {}`;
      // generate pipe
      const pipe = `${blockName} -> TestLoaderBlock;`;
      pipelineContent += `\n${loaderBlock}\n${pipe}`;
    }
    return `pipeline Test {
      ${pipelineContent}
    }`;
  }

  beforeAll(() => {
    // Register test extension
    useExtension(testExtension);
    // Register std extension
    useExtension(stdExtension);
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Create validation helper for language services
    validate = validationHelper(services);
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  it.each(
    stdExtension.getBlockMetaInf().map((metaInfClass) => {
      const metaInf = new metaInfClass();
      return [metaInf.type, metaInf];
    }),
  )(
    'should have no error on %s example validation',
    async (type, blockMetaInf) => {
      for (const example of blockMetaInf.docs.examples ?? []) {
        const text = await generateFullJvExample(blockMetaInf, example.code);

        // Validate input
        const validationResult = await validate(text);
        const diagnostics = validationResult.diagnostics;
        // Expect 0 errors
        expect(diagnostics).toHaveLength(0);
      }
    },
  );
});
