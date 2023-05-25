// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  InternalValueRepresentation,
  TransformDefinition,
  TransformOutputAssignment,
  TransformPortDefinition,
  Valuetype,
  createValuetype,
  evaluateExpression,
} from '@jvalue/jayvee-language-server';

import { ExecutionContext } from '../execution-context';
import { isValidValueRepresentation } from '../types';
import { TableColumn } from '../types/io-types/table';

interface PortDetails {
  port: TransformPortDefinition;
  valuetype: Valuetype;
}

export class TransformExecutor {
  constructor(private readonly transform: TransformDefinition) {}

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
    valuetype: Valuetype;
  }[] {
    const ports = this.transform.body.ports.filter((x) => x.kind === kind);
    const portDetails: {
      port: TransformPortDefinition;
      valuetype: Valuetype;
    }[] = [];

    for (const port of ports) {
      const valuetypeNode = port.valueType;
      const valuetype = createValuetype(valuetypeNode);
      assert(valuetype !== undefined);
      portDetails.push({
        port: port,
        valuetype: valuetype,
      });
    }

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

    const newColumn: Array<InternalValueRepresentation> = [];
    const rowsToDelete: number[] = [];

    for (let rowIndex = 0; rowIndex < numberOfRows; ++rowIndex) {
      // add variables to context
      for (const inputDetails of inputDetailsList) {
        const variableName = inputDetails.port.name;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const column = columns.get(variableName)!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const variableValue = column.values[rowIndex]!;

        context.evaluationContext.setValueForReference(
          variableName,
          variableValue,
        );
      }

      const newValue = evaluateExpression(
        this.getOutputAssignment().expression,
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
        !isValidValueRepresentation(newValue, outputDetails.valuetype, context)
      ) {
        assert(
          typeof newValue === 'string' ||
            typeof newValue === 'boolean' ||
            typeof newValue === 'number',
        );
        context.logger.logDebug(
          `Invalid value in row ${
            rowIndex + 1
          }: "${newValue.toString()}" does not match the type ${outputDetails.valuetype.getName()}`,
        );
        rowsToDelete.push(rowIndex);
      } else {
        newColumn.push(newValue);
      }

      for (const inputDetails of inputDetailsList) {
        context.evaluationContext.deleteValueForReference(
          inputDetails.port.name,
        );
      }
    }

    return {
      rowsToDelete: rowsToDelete,
      resultingColumn: {
        values: newColumn,
        valuetype: outputDetails.valuetype,
      },
    };
  }
}
