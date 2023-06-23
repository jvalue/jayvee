// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  Table,
  TransformExecutor,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType, PrimitiveValuetypes } from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class TableTransformerExecutor
  implements BlockExecutor<IOType.TABLE, IOType.TABLE>
{
  public static readonly type = 'TableTransformer';
  public readonly inputType = IOType.TABLE;
  public readonly outputType = IOType.TABLE;

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    inputTable: Table,
    context: ExecutionContext,
  ): Promise<R.Result<Table>> {
    const inputColumnName = context.getPropertyValue(
      'inputColumn',
      PrimitiveValuetypes.Text,
    );
    const outputColumnName = context.getPropertyValue(
      'outputColumn',
      PrimitiveValuetypes.Text,
    );
    const usedTransform = context.getPropertyValue(
      'use',
      PrimitiveValuetypes.Transform,
    );

    // check input column exists
    const inputColumn = inputTable.getColumn(inputColumnName);
    if (inputColumn === undefined) {
      return R.err({
        message: `The specified input column "${inputColumnName}" does not exist in the given table`,
        diagnostic: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          node: context.getProperty('inputColumn')!,
        },
      });
    }

    const executor = new TransformExecutor(usedTransform);
    const inputDetails = executor.getInputDetails();
    const outputDetails = executor.getOutputDetails();

    // check input column type matches transform input type
    if (!inputColumn.valuetype.isConvertibleTo(inputDetails.valuetype)) {
      return R.err({
        message: `Type ${inputColumn.valuetype.getName()} of column "${inputColumnName}" is not convertible to type ${inputDetails.valuetype.getName()}`,
        diagnostic: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          node: context.getProperty('use')!,
        },
      });
    }

    // log if output column is overwritten
    const outputColumn = inputTable.getColumn(outputColumnName);
    if (outputColumn !== undefined) {
      context.logger.logInfo(
        `Column "${outputColumnName}" will be overwritten`,
      );

      // log if output column type changes
      if (!outputColumn.valuetype.equals(outputDetails.valuetype)) {
        context.logger.logInfo(
          `Column "${outputColumnName}" will change its type from ${outputColumn.valuetype.getName()} to ${outputDetails.valuetype.getName()}`,
        );
      }
    }

    // perform transformation
    const transformResult = executor.executeTransform(inputColumn, context);

    const outputTable = inputTable.clone();
    outputTable.dropRows(transformResult.rowsToDelete);
    outputTable.addColumn(outputColumnName, transformResult.resultingColumn);

    return R.ok(outputTable);
  }
}
