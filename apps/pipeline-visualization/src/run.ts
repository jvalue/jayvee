import * as fs from 'fs';

import { registerDefaultConstraintExecutors } from '@jvalue/jayvee-execution';
import {
  ExitCode,
  LoggerFactory,
  RunOptions,
  extractAstNodeFromFile,
  useStdExtension,
} from '@jvalue/jayvee-interpreter-lib';
import {
  JayveeModel,
  JayveeServices,
  createJayveeServices,
} from '@jvalue/jayvee-language-server';
import { NodeFileSystem } from 'langium/node';

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
  const options: RunOptions = {
    env: new Map(),
    debug: true,
    debugGranularity: 'peek',
    debugTarget: undefined,
  };
  const exitCode = await runModel(extractAstNodeFn, options, mermaidOptions);
  process.exit(exitCode);
}

export async function runModel(
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

  const pipelineMermaidCode = createMermaidRepresentation(
    model,
    mermaidOptions,
  );
  const mermaidTheme = setMermaidTheme();

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
