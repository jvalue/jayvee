import { 
  registerDefaultConstraintExecutors, 
} from '@jvalue/jayvee-execution';

import {
  LoggerFactory,
  RunOptions,
  extractAstNodeFromFile,
  interpretModel,
  useStdExtension, 
} from '@jvalue/jayvee-interpreter-lib';
import { 
  JayveeModel, 
  JayveeServices, 
  createJayveeServices, 
  PipelineDefinition 
} from '@jvalue/jayvee-language-server';

import { NodeFileSystem } from 'langium/node';

export enum ExitCode {
  SUCCESS = 0,
  FAILURE = 1,
  }
  
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

  const pipelineMermaidCodes: Array<String> = model.pipelines.map(
    (pipeline) => {return createMermaidCode(pipeline)}
  )
  console.log("nr. of pipelines found", pipelineMermaidCodes.length)
  for (let pipelineMermaidCode of pipelineMermaidCodes) {
    console.log("---------Mermaid Code---------")
    console.log(pipelineMermaidCode)
    console.log("-----------------------------")
  }  
  return ExitCode.SUCCESS;
}


function createMermaidCode(pipeline: PipelineDefinition){
  let diagramType: string = "flowchart TD";
  let blockList: string[] = [];
  for (const block of pipeline.blocks)  {
    blockList.push(block.name);
  }
  return diagramType + "\n" + blockList.join('-->');
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