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
  implementsStatic,
} from '@jvalue/jayvee-execution';
import {
  IOType,
  InternalValueRepresentation,
  createValuetype,
  evaluateExpression,
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
    const inputColumnName = context.getTextPropertyValue('inputColumn');
    const outputColumnName = context.getTextPropertyValue('outputColumn');
    const usedTransform = context.getTransformPropertyValue('use');

    // check input column exists
    const inputColumnValuetype = inputTable.getColumnType(inputColumnName);
    if (inputColumnValuetype === undefined) {
      return R.err({
        message: `The specified input column "${inputColumnName}" does not exist in the given table`,
        diagnostic: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          node: context.getProperty('inputColumn')!,
        },
      });
    }

    const transformInputPorts = usedTransform.body.ports.filter(
      (x) => x.kind === 'from',
    );
    assert(transformInputPorts.length === 1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const transformInput = transformInputPorts[0]!;
    const transformInputType = transformInput.valueType;
    const transformInputValuetype = createValuetype(transformInputType);

    const transformOutputPorts = usedTransform.body.ports.filter(
      (x) => x.kind === 'to',
    );
    assert(transformOutputPorts.length === 1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const transformOutputType = transformOutputPorts[0]!.valueType;
    const transformOutputValuetype = createValuetype(transformOutputType);

    // check input column type matches transform input type
    if (!inputColumnValuetype.isConvertibleTo(transformInputValuetype)) {
      return R.err({
        message: `Type ${inputColumnValuetype.getName()} of column "${inputColumnName}" is not convertible to type ${transformInputValuetype.getName()}`,
        diagnostic: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          node: context.getProperty('use')!,
        },
      });
    }

    // log if output column is overwritten
    const outputColumnValuetype = inputTable.getColumnType(outputColumnName);
    if (outputColumnValuetype !== undefined) {
      context.logger.logInfo(
        `Column "${outputColumnName}" will be overwritten`,
      );

      // log if output column type changes
      if (!outputColumnValuetype.equals(transformOutputValuetype)) {
        context.logger.logInfo(
          `Column "${outputColumnName}" will change its type from ${outputColumnValuetype.getName()} to ${transformOutputValuetype.getName()}`,
        );
      }
    }

    const outputTable = inputTable.clone();

    // perform transformation
    const transformAssignments = usedTransform.body.outputAssignments;
    assert(transformAssignments.length === 1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const transformAssignment = transformAssignments[0]!;

    const newColumn: Array<InternalValueRepresentation> = [];
    const rowsToDelete: number[] = [];
    inputTable.forEachEntryInColumn(inputColumnName, (entry, rowIndex) => {
      context.evaluationContext.setValueForReference(
        transformInput.name,
        entry,
      );
      const newValue = evaluateExpression(
        transformAssignment.expression,
        context.evaluationContext,
      );

      if (newValue === undefined) {
        context.logger.logDebug(
          `Dropping row ${
            rowIndex + 1
          }: Could not evaluate transform expression`,
        );
        rowsToDelete.push(rowIndex);
      } else if (
        !transformOutputValuetype.acceptVisitor(
          new R.IsValidVisitor(newValue, context),
        )
      ) {
        assert(
          typeof newValue === 'string' ||
            typeof newValue === 'boolean' ||
            typeof newValue === 'number',
        );
        context.logger.logDebug(
          `Invalid value in row ${
            rowIndex + 1
          }: "${newValue.toString()}" does not match the type ${transformOutputValuetype.getName()}`,
        );
        rowsToDelete.push(rowIndex);
      } else {
        newColumn.push(newValue);
      }

      context.evaluationContext.deleteValueForReference(transformInput.name);
    });

    rowsToDelete
      .sort((a, b) => b - a) // delete descending to avoid messing up row indices
      .forEach((rowId) => {
        outputTable.dropRow(rowId);
      });

    // write result to table
    outputTable.addColumn(outputColumnName, {
      values: newColumn,
      valuetype: transformOutputValuetype,
    });

    return R.ok(outputTable);
  }
}
