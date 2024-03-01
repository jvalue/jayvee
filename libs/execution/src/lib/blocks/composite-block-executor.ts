// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert/strict';

import {
  BlockDefinition,
  BlocktypePipeline,
  BlocktypeProperty,
  CompositeBlocktypeDefinition,
  EvaluationContext,
  IOType,
  InternalValueRepresentation,
  Valuetype,
  createValuetype,
  evaluateExpression,
  evaluatePropertyValue,
  getIOType,
  isCompositeBlocktypeDefinition,
} from '@jvalue/jayvee-language-server';

// eslint-disable-next-line import/no-cycle
import { ExecutionContext } from '../execution-context';
import { IOTypeImplementation } from '../types';

import { executeBlocks } from './block-execution-util';
import { AbstractBlockExecutor, BlockExecutor } from './block-executor';
import { BlockExecutorClass } from './block-executor-class';
import * as R from './execution-result';

export function createCompositeBlockExecutor(
  inputType: IOType,
  outputType: IOType,
  block: BlockDefinition,
): BlockExecutorClass<BlockExecutor<IOType, IOType>> {
  assert(
    block.type.ref,
    `Blocktype reference missing for block ${block.name}.`,
  );

  assert(
    isCompositeBlocktypeDefinition(block.type.ref),
    `Blocktype is not a composite block for block ${block.name}.`,
  );

  const blockTypeReference = block.type.ref;

  return class extends AbstractBlockExecutor<
    typeof inputType,
    typeof outputType
  > {
    public static readonly type = blockTypeReference.name;

    constructor() {
      super(inputType, outputType);
    }

    async doExecute(
      input: IOTypeImplementation<typeof inputType>,
      context: ExecutionContext,
    ): Promise<R.Result<IOTypeImplementation<typeof outputType> | null>> {
      context.logger.logDebug(
        `Executing composite block of type ${
          block.type.ref?.name ?? 'undefined'
        }`,
      );

      this.addVariablesToContext(block, blockTypeReference.properties, context);

      const executionResult = await executeBlocks(
        context,
        blockTypeReference,
        input,
      );

      if (R.isErr(executionResult)) {
        const diagnosticError = executionResult.left;
        context.logger.logErrDiagnostic(
          diagnosticError.message,
          diagnosticError.diagnostic,
        );
      }

      this.removeVariablesFromContext(blockTypeReference.properties, context);

      if (R.isOk(executionResult)) {
        // The last block always pipes into the output if it exists
        const pipeline = getPipeline(blockTypeReference);
        const lastBlock = pipeline.blocks.at(-1);

        const blockExecutionResult = R.okData(executionResult).find(
          (result) => result.block.name === lastBlock?.ref?.name,
        );

        assert(
          blockExecutionResult,
          `No execution result found for composite block ${
            block.type.ref?.name ?? 'undefined'
          }`,
        );

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

    private addVariablesToContext(
      block: BlockDefinition,
      properties: BlocktypeProperty[],
      context: ExecutionContext,
    ) {
      properties.forEach((blocktypeProperty) => {
        const valueType = createValuetype(blocktypeProperty.valueType);

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

      if (propertyFromBlock !== undefined) {
        const value = evaluatePropertyValue(
          propertyFromBlock,
          evaluationContext,
          valueType,
        );

        if (value !== undefined) {
          return value;
        }
      }

      const propertyFromBlockType = properties.find(
        (property) => property.name === name,
      );

      if (propertyFromBlockType?.defaultValue === undefined) {
        return;
      }

      return evaluateExpression(
        propertyFromBlockType.defaultValue,
        evaluationContext,
      );
    }
  };
}

function getPipeline(block: CompositeBlocktypeDefinition): BlocktypePipeline {
  assert(
    block.pipes[0],
    `Composite block ${block.name} must have exactly one pipeline.`,
  );
  return block.pipes[0];
}

export function getInputType(block: CompositeBlocktypeDefinition): IOType {
  assert(
    block.inputs.length === 1,
    `Composite block ${block.name} must have exactly one input.`,
  );
  return block.inputs[0] ? getIOType(block.inputs[0]) : IOType.NONE;
}

export function getOutputType(block: CompositeBlocktypeDefinition): IOType {
  assert(
    block.outputs.length === 1,
    `Composite block ${block.name} must have exactly one output.`,
  );
  return block.outputs[0] ? getIOType(block.outputs[0]) : IOType.NONE;
}
