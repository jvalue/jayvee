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
import { TableColumn } from '../types/io-types/table';
import { IsValidVisitor } from '../types/valuetypes/visitors/is-valid-visitor';

export class TransformExecutor {
  constructor(private readonly transform: TransformDefinition) {}

  getInputDetails(): {
    port: TransformPortDefinition;
    valuetype: Valuetype;
  } {
    return this.getPortDetails('from');
  }

  getOutputDetails(): {
    port: TransformPortDefinition;
    valuetype: Valuetype;
  } {
    return this.getPortDetails('to');
  }

  private getPortDetails(kind: TransformPortDefinition['kind']): {
    port: TransformPortDefinition;
    valuetype: Valuetype;
  } {
    const outputPorts = this.transform.body.ports.filter(
      (x) => x.kind === kind,
    );
    assert(outputPorts.length === 1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputPort = outputPorts[0]!;
    const outputType = outputPort.valueType;
    const outputValuetype = createValuetype(outputType);
    assert(outputValuetype !== undefined);

    return {
      port: outputPort,
      valuetype: outputValuetype,
    };
  }

  getOutputAssignment(): TransformOutputAssignment {
    const outputAssignments = this.transform.body.outputAssignments;
    assert(outputAssignments.length === 1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return outputAssignments[0]!;
  }

  executeTransform(
    column: TableColumn,
    context: ExecutionContext,
  ): {
    resultingColumn: TableColumn;
    rowsToDelete: number[];
  } {
    context.enterNode(this.transform);

    const result = this.doExecuteTransform(column, context);
    context.exitNode(this.transform);

    return result;
  }

  private doExecuteTransform(
    column: TableColumn,
    context: ExecutionContext,
  ): {
    resultingColumn: TableColumn;
    rowsToDelete: number[];
  } {
    const inputDetails = this.getInputDetails();
    const outputDetails = this.getOutputDetails();

    const newColumn: Array<InternalValueRepresentation> = [];
    const rowsToDelete: number[] = [];
    column.values.forEach((entry, rowIndex) => {
      context.evaluationContext.setValueForReference(
        inputDetails.port.name,
        entry,
      );
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
        !outputDetails.valuetype.acceptVisitor(
          new IsValidVisitor(newValue, context),
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
          }: "${newValue.toString()}" does not match the type ${outputDetails.valuetype.getName()}`,
        );
        rowsToDelete.push(rowIndex);
      } else {
        newColumn.push(newValue);
      }

      context.evaluationContext.deleteValueForReference(inputDetails.port.name);
    });

    return {
      rowsToDelete: rowsToDelete,
      resultingColumn: {
        values: newColumn,
        valuetype: outputDetails.valuetype,
      },
    };
  }
}
