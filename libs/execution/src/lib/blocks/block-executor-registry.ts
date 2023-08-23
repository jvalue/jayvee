// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockDefinition,
  BlocktypeProperty,
  EvaluationContext,
  IOType,
  InternalValueRepresentation,
  Registry,
  Valuetype,
  createValuetype,
  evaluateExpression,
  evaluatePropertyValue,
  getBlocksInTopologicalSorting,
  getIOType,
  isCompositeBlocktypeDefinition,
} from '@jvalue/jayvee-language-server';
import * as R from '@jvalue/jayvee-execution';
import { NONE, executeBlocks } from '@jvalue/jayvee-execution';

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

  if (
    !blockExecutorRegistry.get(blockType) &&
    block.type.ref &&
    isCompositeBlocktypeDefinition(block.type.ref)
  ) {
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
        context.logger.logDebug(
          `Executing composite block of type ${blockType}`,
        );

        this.addVariablesToContext(block, blockReference.properties, context);

        const executionOrder = getBlocksInTopologicalSorting(
          blockReference,
        ).map((block) => {
          return { block: block, value: NONE };
        });

        const executionResult = await executeBlocks(context, executionOrder);

        if (R.isErr(executionResult)) {
          const diagnosticError = executionResult.left;
          context.logger.logErrDiagnostic(
            diagnosticError.message,
            diagnosticError.diagnostic,
          );
        }

        this.removeVariablesFromContext(blockReference.properties, context);

        // Todo unfuck this to handle: no pipeline, two pipelines, two outputs? no outputs (can not happen due to grammer?)? move them into a getOutput getLastValue etc function
        const pipeline = blockReference.pipes[0]!;
        if (R.isOk(executionResult) && pipeline.output) {
          // The last block always pipes into the output if it exists
          const lastBlock = pipeline.blocks.at(-1);

          const blockExecutionResult = R.okData(executionResult).find(
            (result) => result.block.name === lastBlock?.ref?.name,
          );

          assert(blockExecutionResult);

          return R.ok(blockExecutionResult.value);
        }

        return R.ok(null);
      }

      private removeVariablesFromContext(
        properties: BlocktypeProperty[],
        context: ExecutionContext,
      ) {
        properties.forEach((prop) =>
          context.evaluationContext.deleteValueForReference(prop.name),
        );
      }

      // TODO implement
      private addVariablesToContext(
        block: BlockDefinition,
        properties: BlocktypeProperty[],
        context: ExecutionContext,
      ) {
        properties.forEach((blocktypeProperty) => {
          const valueType = createValuetype(blocktypeProperty.valuetype);

          // Todo fix or error nicely
          assert(
            valueType,
            `Can not create valuetype for blocktype property ${blocktypeProperty.name}`,
          );

          const propertyValue = this.getPropertyValueFromBlockOrDefault(
            blocktypeProperty.name,
            valueType,
            block,
            properties,
            context.evaluationContext,
          );

          // Todo fix or error nicely
          assert(
            propertyValue !== undefined,
            `Can not get value for blocktype property ${blocktypeProperty.name}`,
          );

          context.evaluationContext.setValueForReference(
            blocktypeProperty.name,
            propertyValue,
          );
        });
      }

      private getPropertyValueFromBlockOrDefault(
        name: string,
        valueType: Valuetype,
        block: BlockDefinition,
        properties: BlocktypeProperty[],
        evaluationContext: EvaluationContext,
      ): InternalValueRepresentation | undefined {
        const propertyFromBlock = block.body.properties.find(
          (property) => property.name === name,
        );

        if (propertyFromBlock) {
          const value = evaluatePropertyValue(
            propertyFromBlock,
            evaluationContext,
            valueType,
          );

          if (value) {
            return value;
          }
        }

        const propertyFromBlockType = properties.find(
          (property) => property.name === name,
        );

        if (
          !propertyFromBlockType ||
          propertyFromBlockType.defaultValue == undefined
        ) {
          return undefined;
        }

        return evaluateExpression(
          propertyFromBlockType.defaultValue,
          evaluationContext,
        );
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
