import * as R from '@jayvee/execution';
import {
  createBlockExecutor,
  useExtension as useExecutionExtension,
} from '@jayvee/execution';
import { StdExecExtension } from '@jayvee/extensions/std/exec';
import { StdLangExtension } from '@jayvee/extensions/std/lang';
import {
  Block,
  Model,
  Pipeline,
  collectChildren,
  collectParents,
  collectStartingBlocks,
  createJayveeServices,
  getBlocksInTopologicalSorting,
  useExtension as useLangExtension,
} from '@jayvee/language-server';
import * as E from 'fp-ts/lib/Either';
import { NodeFileSystem } from 'langium/node';

import { extractAstNode, printError } from './cli-util';
import {
  extractRequiredRuntimeParameters,
  extractRuntimeParameters,
} from './runtime-parameter-util';

enum ExitCode {
  SUCCESS = 0,
  FAILURE = 1,
}

export async function runAction(
  fileName: string,
  options: { env: Map<string, string> },
): Promise<void> {
  useExecutionExtension(new StdExecExtension());
  useLangExtension(new StdLangExtension());

  const services = createJayveeServices(NodeFileSystem).Jayvee;
  const model = await extractAstNode<Model>(fileName, services);

  const requiredRuntimeParameters = extractRequiredRuntimeParameters(model);
  const parameterReadResult = extractRuntimeParameters(
    requiredRuntimeParameters,
    options.env,
  );
  if (E.isLeft(parameterReadResult)) {
    parameterReadResult.left.forEach((x) => printError(x));
    process.exit(ExitCode.FAILURE);
  }

  const interpretationExitCode = await interpretPipelineModel(
    model,
    R.okData(parameterReadResult),
  );
  process.exit(interpretationExitCode);
}

async function interpretPipelineModel(
  model: Model,
  runtimeParameters: Map<string, string | number | boolean>,
): Promise<ExitCode> {
  console.info('Interpreting pipeline model');
  const pipelineRuns: Array<Promise<ExitCode>> = model.pipelines.map(
    (pipeline) => runPipeline(pipeline, runtimeParameters),
  );
  const exitCodes = await Promise.all(pipelineRuns);

  if (exitCodes.includes(ExitCode.FAILURE)) {
    return ExitCode.FAILURE;
  }
  return ExitCode.SUCCESS;
}

async function runPipeline(
  pipeline: Pipeline,
  runtimeParameters: Map<string, string | number | boolean>,
): Promise<ExitCode> {
  printPipeline(pipeline, runtimeParameters);

  try {
    const executionOrder: Array<{ block: Block; value: unknown }> =
      getBlocksInTopologicalSorting(pipeline).map((block) => {
        return { block: block, value: undefined };
      });

    for (const blockData of executionOrder) {
      const blockExecutor = createBlockExecutor(
        blockData.block,
        runtimeParameters,
      );
      const parentData = collectParents(blockData.block).map((parent) =>
        executionOrder.find((blockData) => parent === blockData.block),
      );

      const value = parentData[0]?.value;

      try {
        blockData.value = await R.dataOrThrowAsync(
          blockExecutor.execute(value),
        );
      } catch (errObj) {
        if (R.isExecutionErrorDetails(errObj)) {
          printError(errObj);
          return ExitCode.FAILURE;
        }
        throw errObj;
      }
    }
  } catch (errObj) {
    // If a pipeline contains cycles, an exception will be thrown.
    console.error(errObj);
    return ExitCode.FAILURE;
  }

  return ExitCode.SUCCESS;
}

export function printPipeline(
  pipeline: Pipeline,
  runtimeParameters: Map<string, string | number | boolean>,
  printCallback: (output: string) => void = console.info,
) {
  const toString = (block: Block, depth = 0): string => {
    const blockString = `${'\t'.repeat(depth)} -> ${block.name} (${
      block.type
    })`;
    const childString = collectChildren(block)
      .map((child) => toString(child, depth + 1))
      .join('\n');
    return blockString + '\n' + childString;
  };

  printCallback(`Pipeline ${pipeline.name}:`);
  printCallback(`\tRuntime Parameters (${runtimeParameters.size}):`);
  for (const key of runtimeParameters.keys()) {
    console.log(
      `\t ${key}: ${
        runtimeParameters.has(key)
          ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            runtimeParameters.get(key)!.toString()
          : 'undefined'
      }`,
    );
  }
  printCallback(
    `\tBlocks (${pipeline.blocks.length} blocks with ${pipeline.pipes.length} pipes):`,
  );
  for (const block of collectStartingBlocks(pipeline)) {
    printCallback(toString(block, 1));
  }
}
