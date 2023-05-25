// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  Table,
  TransformExecutor,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import {
  CollectionValuetype,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

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
    const inputColumnNames = context.getPropertyValue(
      'inputColumns',
      new CollectionValuetype(PrimitiveValuetypes.Text),
    );
    const outputColumnName = context.getPropertyValue(
      'outputColumn',
      PrimitiveValuetypes.Text,
    );
    const usedTransform = context.getPropertyValue(
      'use',
      PrimitiveValuetypes.Transform,
    );

    // check input columns exist
    for (const inputColumnName of inputColumnNames) {
      const inputColumn = inputTable.getColumn(inputColumnName);
      if (inputColumn === undefined) {
        return R.err({
          message: `The specified input column "${inputColumnName}" does not exist in the given table`,
          diagnostic: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            node: context.getProperty('inputColumns')!,
          },
        });
      }
    }

    const executor = new TransformExecutor(usedTransform);
    const transformInputDetailsList = executor.getInputDetails();
    const transformOutputDetails = executor.getOutputDetails();

    // check input column types matche transform input types
    const variableToColumnMap: Map<string, R.TableColumn> = new Map();
    for (let i = 0; i < inputColumnNames.length; ++i) {
      const inputColumnName = inputColumnNames[i];
      assert(inputColumnName !== undefined);
      const inputColumn = inputTable.getColumn(inputColumnName);
      assert(inputColumn !== undefined);

      const matchingInputDetails = transformInputDetailsList[i];
      assert(matchingInputDetails !== undefined);

      if (
        !inputColumn.valuetype.isConvertibleTo(matchingInputDetails.valuetype)
      ) {
        return R.err({
          message: `Type ${inputColumn.valuetype.getName()} of column "${inputColumnName}" is not convertible to type ${matchingInputDetails.valuetype.getName()}`,
          diagnostic: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            node: context.getProperty('use')!,
          },
        });
      }
      const variableName = matchingInputDetails.port.name;
      variableToColumnMap.set(variableName, inputColumn);
    }

    // log if output column is overwritten
    const outputColumn = inputTable.getColumn(outputColumnName);
    if (outputColumn !== undefined) {
      context.logger.logInfo(
        `Column "${outputColumnName}" will be overwritten`,
      );

      // log if output column type changes
      if (!outputColumn.valuetype.equals(transformOutputDetails.valuetype)) {
        context.logger.logInfo(
          `Column "${outputColumnName}" will change its type from ${outputColumn.valuetype.getName()} to ${transformOutputDetails.valuetype.getName()}`,
        );
      }
    }

    // perform transformation
    const transformResult = executor.executeTransform(
      variableToColumnMap,
      inputTable.getNumberOfRows(),
      context,
    );

    // construct output table
    const outputTable = inputTable.clone();
    outputTable.dropRows(transformResult.rowsToDelete);
    outputTable.addColumn(outputColumnName, transformResult.resultingColumn);

    return R.ok(outputTable);
  }
}
