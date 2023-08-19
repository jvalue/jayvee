// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockDefinition,
  IOType,
  Registry,
  getIOType,
} from '@jvalue/jayvee-language-server';
import * as R from '@jvalue/jayvee-execution';

import { AbstractBlockExecutor, BlockExecutor } from './block-executor';
import { BlockExecutorClass } from './block-executor-class';
import { IOTypeImplementation } from '../types';
import { ExecutionContext } from '../execution-context';

export const blockExecutorRegistry = new Registry<BlockExecutorClass>();

export function registerBlockExecutor(executorClass: BlockExecutorClass) {
  blockExecutorRegistry.register(executorClass.type, executorClass);
}

export function getRegisteredBlockExecutors(): BlockExecutorClass[] {
  return [...blockExecutorRegistry.getAll()];
}

export function createBlockExecutor(block: BlockDefinition): BlockExecutor {
  const blockType = block.type.ref?.name;
  assert(blockType !== undefined);

  if (!blockExecutorRegistry.get(blockType) && block.type.ref) {
    const blockReference = block.type.ref;
    // Todo, what if more than one input/output exists?
    const inputType = blockReference.inputs[0]
      ? getIOType(blockReference.inputs[0])
      : IOType.NONE;
    const outputType = blockReference.outputs[0]
      ? getIOType(blockReference.outputs[0])
      : IOType.NONE;
    const executorClass = class extends AbstractBlockExecutor<
      typeof inputType,
      typeof outputType
    > {
      public readonly /* static TODO: this static does not work with this version of typescript? */ type =
        blockReference.name;

      constructor() {
        super(inputType, outputType);
      }

      // eslint-disable-next-line @typescript-eslint/require-await
      async doExecute(
        input: IOTypeImplementation<typeof inputType>,
        context: ExecutionContext,
      ): Promise<R.Result<IOTypeImplementation<typeof outputType> | null>> {
        console.log('ANON BLOCK EXECUTOR CALLED');
        return R.ok(null);
      }
    };

    // Todo: It seems to not know that type exists here, other executors have a
    // @implementsStatic<BlockExecutorClass>()
    // which the anon class can not use?
    blockExecutorRegistry.register(
      blockReference.name,
      executorClass as unknown as BlockExecutorClass<
        BlockExecutor<IOType, IOType>
      >,
    );
  }

  const blockExecutor = blockExecutorRegistry.get(blockType);

  assert(
    blockExecutor !== undefined,
    `No executor was registered for block type ${blockType}`,
  );

  return new blockExecutor();
}
