import { 
  None, 
  isDebugGranularity, 
  registerDefaultConstraintExecutors, 
  parseValueToInternalRepresentation 
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
  RuntimeParameterProvider, 
  PipelineDefinition 
} from '@jvalue/jayvee-language-server';

import { NodeFileSystem } from 'langium/node';
import { runMain } from 'module';

export enum ExitCode {
  SUCCESS = 0,
  FAILURE = 1,
  }
  
export async function myRunAction(
  fileName: string,
  options: RunOptions,
): Promise<void> {
  console.log("reached my run action")
  const extractAstNodeFn = async (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) =>
    await extractAstNodeFromFile<JayveeModel>(
      fileName,
      services,
      loggerFactory.createLogger(),
    );
  console.log("before interpret")
  const exitCode = await interpretModel(extractAstNodeFn, options);
  //const exitCode = await myInterpretModel(extractAstNodeFn, options);
  console.log("model interpreted")
  //process.exit(exitCode);
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
  
  console.log("reached model")
  const model = await extractAstNodeFn(services, loggerFactory);
  console.log("after model")
  let mermaidCode = createMermaidCode(model.pipelines[0]!)
  console.log("---------Mermaid Code---------")
  console.log(mermaidCode)
  console.log("-----------------------------")
  
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
  let fileName: string = "example/electric-vehicles.jv";
  let options: RunOptions = {
    env: new Map,
    debug: true,
    debugGranularity: "peek",
    debugTarget: undefined
  }
  const result = await myRunAction(fileName, options);
  console.log("End world");
  process.exit(0)
}

myCall()