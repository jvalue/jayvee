import * as fs from 'fs';

import { 
  registerDefaultConstraintExecutors, 
} from '@jvalue/jayvee-execution';

import {
  LoggerFactory,
  RunOptions,
  extractAstNodeFromFile,
  interpretModel,
  useStdExtension,
  ExitCode 
} from '@jvalue/jayvee-interpreter-lib';
import { 
  JayveeModel, 
  JayveeServices, 
  createJayveeServices, 
  PipelineDefinition, 
  getBlocksInTopologicalSorting 
} from '@jvalue/jayvee-language-server';

import { NodeFileSystem } from 'langium/node';

import { Command } from 'commander';

import {
  MermaidOptions, 
  createMermaidRepresentation,
  setMermaidTheme,
 } from './mermaid_utils';
  
export async function myRunAction(
  fileName: string,
  options: RunOptions,
  mermaidOptions: MermaidOptions
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
  //const exitCode = await interpretModel(extractAstNodeFn, options);
  const exitCode = await myInterpretModel(extractAstNodeFn, options, mermaidOptions);
}

export async function myInterpretModel(
  extractAstNodeFn: (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) => Promise<JayveeModel>,
  options: RunOptions,
  mermaidOptions: MermaidOptions
) {
  const loggerFactory = new LoggerFactory(options.debug);

  useStdExtension();
  registerDefaultConstraintExecutors();
  
  const services = createJayveeServices(NodeFileSystem).Jayvee;
  
  const model = await extractAstNodeFn(services, loggerFactory);

  const myblocks = getBlocksInTopologicalSorting(model.pipelines[0]!)
  let pipelineMermaidCode = createMermaidRepresentation(model, mermaidOptions)
  let mermaidTheme = setMermaidTheme()

  console.log("---------Mermaid Code---------")
  console.log(pipelineMermaidCode)
  fs.writeFileSync("./mermaid_code.txt", pipelineMermaidCode);
  console.log("-----------------------------")
  console.log("---------Mermaid Theme---------")
  console.log(mermaidTheme)
  fs.writeFileSync("./mermaid_style.txt", mermaidTheme);
  console.log("-----------------------------")

  return ExitCode.SUCCESS;
}

async function myCall(
  fileName: string,
  mermaidOptions: MermaidOptions
){
  console.log('Hello World!');
  let options: RunOptions = {
    env: new Map,
    debug: true,
    debugGranularity: "peek",
    debugTarget: undefined
  }
  const result = await myRunAction(fileName, options, mermaidOptions);
  console.log("End World");
  process.exit(0)
}

const program = new Command();
program
  .version("0.1.0")
  .description("Generating mermaid.js code from .jv-files")
  .argument('<file>', `path to the .jv source file`)
  .option(
    '-c, --composite-blocks',
    'show building blocks of composite blocks', 
    false
  )
  .option(
    '-p, --properties',
    'show properties of blocks',
    false
  )
  .action(myCall)
  .parse(process.argv);


//for debugging with nx-serve
const mermaidOptions: MermaidOptions = {
  composite: true,
  properties: true
}
//myCall("example/cars.jv", mermaidOptions)