// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  type InternalValueRepresentation,
  type TransformDefinition,
  type TransformOutputAssignment,
  type TransformPortDefinition,
  type ValueType,
  evaluateExpression,
} from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../execution-context';
import { isValidValueRepresentation } from '../types';
import { type TableColumn } from '../types/io-types/table';

export interface PortDetails {
  port: TransformPortDefinition;
  valueType: ValueType;
}

export class TransformExecutor {
  constructor(
    private readonly transform: TransformDefinition,
    private readonly context: ExecutionContext,
  ) {}

  getInputDetails(): PortDetails[] {
    return this.getPortDetails('from');
  }

  getOutputDetails(): PortDetails {
    const portDetails = this.getPortDetails('to');
    assert(portDetails.length === 1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return portDetails[0]!;
  }

  private getPortDetails(kind: TransformPortDefinition['kind']): {
    port: TransformPortDefinition;
    valueType: ValueType;
  }[] {
    const ports = this.transform.body.ports.filter((x) => x.kind === kind);
    const portDetails = ports.map((port) => {
      const valueTypeNode = port.valueType;
      const valueType =
        this.context.wrapperFactories.ValueType.wrap(valueTypeNode);
      assert(valueType !== undefined);
      return {
        port: port,
        valueType: valueType,
      };
    });

    return portDetails;
  }

  getOutputAssignment(): TransformOutputAssignment {
    const outputAssignments = this.transform.body.outputAssignments;
    assert(outputAssignments.length === 1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return outputAssignments[0]!;
  }

  executeTransform(
    columns: Map<string, TableColumn>,
    numberOfRows: number,
    context: ExecutionContext,
  ): {
    resultingColumn: TableColumn;
    rowsToDelete: number[];
  } {
    context.enterNode(this.transform);

    const result = this.doExecuteTransform(columns, numberOfRows, context);
    context.exitNode(this.transform);

    return result;
  }

  private doExecuteTransform(
    columns: Map<string, TableColumn>,
    numberOfRows: number,
    context: ExecutionContext,
  ): {
    resultingColumn: TableColumn;
    rowsToDelete: number[];
  } {
    const inputDetailsList = this.getInputDetails();
    const outputDetails = this.getOutputDetails();

    const newColumn: InternalValueRepresentation[] = [];
    const rowsToDelete: number[] = [];

    for (let rowIndex = 0; rowIndex < numberOfRows; ++rowIndex) {
      this.addVariablesToContext(inputDetailsList, columns, rowIndex, context);

      let newValue: InternalValueRepresentation | undefined = undefined;
      try {
        newValue = evaluateExpression(
          this.getOutputAssignment().expression,
          context.evaluationContext,
          context.wrapperFactories,
        );
      } catch (e) {
        if (e instanceof Error) {
          context.logger.logDebug(e.message);
        } else {
          context.logger.logDebug(String(e));
        }
      }

      if (newValue === undefined) {
        context.logger.logDebug(
          `Dropping row ${
            rowIndex + 1
          }: Could not evaluate transform expression`,
        );
        rowsToDelete.push(rowIndex);
      } else if (
        !isValidValueRepresentation(newValue, outputDetails.valueType, context)
      ) {
        assert(
          typeof newValue === 'string' ||
            typeof newValue === 'boolean' ||
            typeof newValue === 'number',
        );
        context.logger.logDebug(
          `Invalid value in row ${
            rowIndex + 1
          }: "${newValue.toString()}" does not match the type ${outputDetails.valueType.getName()}`,
        );
        rowsToDelete.push(rowIndex);
      } else {
        newColumn.push(newValue);
      }

      this.removeVariablesFromContext(inputDetailsList, context);
    }

    return {
      rowsToDelete: rowsToDelete,
      resultingColumn: {
        values: newColumn,
        valueType: outputDetails.valueType,
      },
    };
  }

  private removeVariablesFromContext(
    inputDetailsList: PortDetails[],
    context: ExecutionContext,
  ) {
    for (const inputDetails of inputDetailsList) {
      context.evaluationContext.deleteValueForReference(inputDetails.port.name);
    }
  }

  private addVariablesToContext(
    inputDetailsList: PortDetails[],
    columns: Map<string, TableColumn<InternalValueRepresentation>>,
    rowIndex: number,
    context: ExecutionContext,
  ) {
    for (const inputDetails of inputDetailsList) {
      const variableName = inputDetails.port.name;

      const column = columns.get(variableName);
      assert(column !== undefined);

      const variableValue = column.values[rowIndex];
      assert(variableValue !== undefined);

      context.evaluationContext.setValueForReference(
        variableName,
        variableValue,
      );
    }
  }
}
