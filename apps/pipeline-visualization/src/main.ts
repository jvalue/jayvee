import * as fs from 'fs';

import { registerDefaultConstraintExecutors } from '@jvalue/jayvee-execution';

import {
  LoggerFactory,
  RunOptions,
  extractAstNodeFromFile,
  interpretModel,
  useStdExtension,
  ExitCode,
} from '@jvalue/jayvee-interpreter-lib';
import {
  JayveeModel,
  JayveeServices,
  createJayveeServices,
  PipelineDefinition,
  getBlocksInTopologicalSorting,
} from '@jvalue/jayvee-language-server';

import { NodeFileSystem } from 'langium/node';

import { Command } from 'commander';

import {
  MermaidOptions,
  createMermaidRepresentation,
  setMermaidTheme,
} from './mermaid_utils';

export async function processOptions(
  fileName: string,
  mermaidOptions: MermaidOptions,
): Promise<void> {
  const extractAstNodeFn = async (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) =>
    await extractAstNodeFromFile<JayveeModel>(
      fileName,
      services,
      loggerFactory.createLogger(),
    );
  let options: RunOptions = {
    env: new Map(),
    debug: true,
    debugGranularity: 'peek',
    debugTarget: undefined,
  };
  //const exitCode = await interpretModel(extractAstNodeFn, options);
  const exitCode = await myInterpretModel(
    extractAstNodeFn,
    options,
    mermaidOptions,
  );
}

export async function myInterpretModel(
  extractAstNodeFn: (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) => Promise<JayveeModel>,
  options: RunOptions,
  mermaidOptions: MermaidOptions,
) {
  const loggerFactory = new LoggerFactory(options.debug);

  useStdExtension();
  registerDefaultConstraintExecutors();

  const services = createJayveeServices(NodeFileSystem).Jayvee;

  const model = await extractAstNodeFn(services, loggerFactory);

  let pipelineMermaidCode = createMermaidRepresentation(model, mermaidOptions);
  let mermaidTheme = setMermaidTheme();

  console.log('---------Mermaid Code----------');
  console.log(pipelineMermaidCode);
  fs.writeFileSync(mermaidOptions.mermaidFile, pipelineMermaidCode);
  console.log('-------------------------------');
  console.log('---------Mermaid Theme---------');
  console.log(mermaidTheme);
  fs.writeFileSync(mermaidOptions.styleFile, mermaidTheme);
  console.log('-------------------------------');

  return ExitCode.SUCCESS;
}

const program = new Command();
program
  .version('0.1.0')
  .description('Generating mermaid.js code from .jv-files')
  .argument('<file>', `path to the .jv source file`)
  .option(
    '-m, --mermaid-file <file>',
    'output file name for mermaid code',
    'mermaid-code.txt',
  )
  .option(
    '-s, --style-file <file>',
    'output file name for mermaid style',
    'mermaid-style.txt',
  )
  .option(
    '-c, --composite-blocks',
    'show building blocks of composite blocks',
    true,
  )
  .option('-p, --properties', 'show properties of blocks', true)
  .action(processOptions)
  .parse(process.argv);
