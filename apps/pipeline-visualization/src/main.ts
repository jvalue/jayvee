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

import { 
  createMermaidRepresentation,
  setMermaidTheme,
 } from './mermaid_utils';
  
export async function myRunAction(
  fileName: string,
  options: RunOptions,
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
  const exitCode = await myInterpretModel(extractAstNodeFn, options);
}

export async function myInterpretModel(
  extractAstNodeFn: (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) => Promise<JayveeModel>,
  options: RunOptions,
) {
  const loggerFactory = new LoggerFactory(options.debug);

  useStdExtension();
  registerDefaultConstraintExecutors();
  
  const services = createJayveeServices(NodeFileSystem).Jayvee;
  
  const model = await extractAstNodeFn(services, loggerFactory);

  const myblocks = getBlocksInTopologicalSorting(model.pipelines[0]!)
  let pipelineMermaidCode = createMermaidRepresentation(model)
  let mermaidTheme = setMermaidTheme()

  console.log("---------Mermaid Code---------")
  console.log(pipelineMermaidCode)
  console.log("-----------------------------")
  console.log("---------Mermaid Theme---------")
  console.log(mermaidTheme)
  console.log("-----------------------------")

  return ExitCode.SUCCESS;
}

async function myCall(){
  console.log('Hello World!');
  let fileName: string = "example/exercise1.jv";
  let options: RunOptions = {
    env: new Map,
    debug: true,
    debugGranularity: "peek",
    debugTarget: undefined
  }
  const result = await myRunAction(fileName, options);
  console.log("End World");
  process.exit(0)
}

myCall()