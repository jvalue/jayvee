// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BlockDefinition,
  type CompositeBlockTypeDefinition,
  type PipelineDefinition,
} from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../execution-context';
import { type Logger } from '../logging/logger';
import { type IOTypeImplementation, NONE } from '../types';

import * as R from './execution-result';

export interface ExecutionOrderItem {
  block: BlockDefinition;
  value: IOTypeImplementation | null;
}

/**
 * Executes an ordered list of blocks in sequence, using outputs from previous blocks as inputs for downstream blocks.
 *
 * @param executionContext The context the blocks are executed in, e.g., a pipeline or composite block
 * @param executionOrder An ordered list of blocks so that blocks that need inputs are after blocks that produce these inputs
 * @param initialInputValue An initial input that was produced outside of this block chain, e.g., as input to a composite block
 *
 * @returns The ordered blocks and their produced outputs or an error on failure
 */
export async function executeBlocks(
  executionContext: ExecutionContext,
  pipesContainer: CompositeBlockTypeDefinition | PipelineDefinition,
  initialInputValue: IOTypeImplementation | undefined = undefined,
): Promise<R.Result<ExecutionOrderItem[]>> {
  const pipelineWrapper =
    executionContext.wrapperFactories.Pipeline.wrap(pipesContainer);
  const executionOrder: {
    block: BlockDefinition;
    value: IOTypeImplementation | null;
  }[] = pipelineWrapper.getBlocksInTopologicalSorting().map((block) => {
    return { block: block, value: NONE };
  });

  let isFirstBlock = true;

  for (const blockData of executionOrder) {
    const block = blockData.block;
    const parentData = pipelineWrapper
      .getParentBlocks(block)
      .map((parent) =>
        executionOrder.find((blockData) => parent === blockData.block),
      );
    let inputValue = parentData[0]?.value ?? NONE;

    const useExternalInputValueForFirstBlock =
      isFirstBlock && inputValue === NONE && initialInputValue !== undefined;

    if (useExternalInputValueForFirstBlock) {
      inputValue = initialInputValue;
    }

    executionContext.enterNode(block);

    const executionResult = await executeBlock(
      inputValue,
      block,
      executionContext,
    );
    if (R.isErr(executionResult)) {
      return executionResult;
    }
    const blockResultData = executionResult.right;
    blockData.value = blockResultData;

    executionContext.exitNode(block);
    isFirstBlock = false;
  }
  return R.ok(executionOrder);
}

export async function executeBlock(
  inputValue: IOTypeImplementation | null,
  block: BlockDefinition,
  executionContext: ExecutionContext,
): Promise<R.Result<IOTypeImplementation | null>> {
  if (inputValue == null) {
    executionContext.logger.logInfoDiagnostic(
      `Skipped execution because parent block emitted no value.`,
      { node: block, property: 'name' },
    );
    return R.ok(null);
  }

  const blockExecutor =
    executionContext.executionExtension.createBlockExecutor(block);

  const startTime = new Date();

  let result: R.Result<IOTypeImplementation | null>;
  try {
    result = await blockExecutor.execute(inputValue, executionContext);
  } catch (unexpectedError) {
    return R.err({
      message: `An unknown error occurred: ${
        unexpectedError instanceof Error
          ? unexpectedError.stack ?? unexpectedError.message
          : JSON.stringify(unexpectedError)
      }`,
      diagnostic: { node: block, property: 'name' },
    });
  }

  logExecutionDuration(startTime, executionContext.logger);

  return result;
}

export function logExecutionDuration(startTime: Date, logger: Logger): void {
  const endTime = new Date();
  const executionDurationMs = Math.round(
    endTime.getTime() - startTime.getTime(),
  );
  logger.logDebug(`Execution duration: ${executionDurationMs} ms.`);
}
