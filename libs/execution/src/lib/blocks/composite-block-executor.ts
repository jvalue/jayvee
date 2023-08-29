import {
  getBlocksInTopologicalSorting,
  BlocktypeProperty,
  BlockDefinition,
  createValuetype,
  Valuetype,
  EvaluationContext,
  InternalValueRepresentation,
  evaluatePropertyValue,
  evaluateExpression,
  IOType,
  isCompositeBlocktypeDefinition,
  CompositeBlocktypeDefinition,
  getIOType,
} from '@jvalue/jayvee-language-server';
import { strict as assert } from 'assert/strict';
import { ExecutionContext } from '../execution-context';
import { IOTypeImplementation, NONE } from '../types';
import { executeBlocks } from './block-execution-util';
import { AbstractBlockExecutor, BlockExecutor } from './block-executor';
import * as R from '@jvalue/jayvee-execution';
import { BlockExecutorClass } from '@jvalue/jayvee-execution';

// Todo: It seems to not know that type exists here, other executors have a
// @implementsStatic<BlockExecutorClass>()
// which the anon class can not use?
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

  const blockReference = block.type.ref;

  return class extends AbstractBlockExecutor<
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
        `Executing composite block of type ${block.type}`,
      );

      this.addVariablesToContext(block, blockReference.properties, context);

      const executionOrder = getBlocksInTopologicalSorting(blockReference).map(
        (block) => {
          return { block: block, value: NONE };
        },
      );

      const executionResult = await executeBlocks(
        context,
        executionOrder,
        input,
      );

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

        assert(
          blockExecutionResult,
          `No execution result found for composite block ${block.type}`,
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
  } as unknown as BlockExecutorClass<BlockExecutor<IOType, IOType>>;
}

export const getInputType = (block: CompositeBlocktypeDefinition): IOType => {
  assert(
    block.inputs.length === 1,
    `Composite block ${block.name} must have exactly one input.`,
  );
  return block.inputs[0] ? getIOType(block.inputs[0]) : IOType.NONE;
};

export const getOutputType = (block: CompositeBlocktypeDefinition): IOType => {
  assert(
    block.outputs.length === 1,
    `Composite block ${block.name} must have exactly one output.`,
  );
  return block.outputs[0] ? getIOType(block.outputs[0]) : IOType.NONE;
};
