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
    RuntimeParameterProvider 
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
//const exitCode = await interpretModel(extractAstNodeFn, options);
const exitCode = await myInterpretModel(extractAstNodeFn, options);
process.exit(exitCode);
}

export async function myInterpretModel(
    extractAstNodeFn: (
      services: JayveeServices,
      loggerFactory: LoggerFactory,
    ) => Promise<JayveeModel>,
    options: RunOptions,
  ) {
    const loggerFactory = new LoggerFactory(options.debug);
  
    //useStdExtension();
    //registerDefaultConstraintExecutors();
  
    const services = createJayveeServices(NodeFileSystem).Jayvee;
  
    const model = await extractAstNodeFn(services, loggerFactory);
    console.log("Reached model")
    
    return ExitCode.SUCCESS;
  }


console.log('Hello World!');
let fileName: string = "example/cars.jv";
let options: RunOptions = {
    env: new Map,
    debug: true,
    debugGranularity: "peek",
    debugTarget: undefined
  }
myRunAction(fileName, options)

process.exit(ExitCode.SUCCESS)

