import {
  collectParents,
  BlockDefinition,
} from '@jvalue/jayvee-language-server';
import { ExecutionContext } from '../execution-context';
import { NONE, IOTypeImplementation } from '../types';
import { createBlockExecutor } from './block-executor-registry';
import * as R from '@jvalue/jayvee-execution';
import { Logger } from '@jvalue/jayvee-execution';

export interface ExecutionOrderItem {
  block: BlockDefinition;
  value: IOTypeImplementation | null;
}

export async function executeBlocks(
  executionContext: ExecutionContext,
  executionOrder: ExecutionOrderItem[],
  initialInputValue: IOTypeImplementation | undefined = undefined,
): Promise<R.Result<ExecutionOrderItem[]>> {
  let isFirstblock = true;

  for (const blockData of executionOrder) {
    const block = blockData.block;
    const parentData = collectParents(block).map((parent) =>
      executionOrder.find((blockData) => parent === blockData.block),
    );
    let inputValue =
      parentData[0]?.value === undefined ? NONE : parentData[0]?.value;

    if (isFirstblock && inputValue == NONE && initialInputValue !== undefined) {
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
    } else {
      const blockResultData = executionResult.right;
      blockData.value = blockResultData;
    }

    executionContext.exitNode(block);
    isFirstblock = false;
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

  const blockExecutor = createBlockExecutor(block);

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
