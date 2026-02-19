// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  ERROR_TYPEGUARD,
  onlyElementOrUndefined,
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  InvalidValue,
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
    const outputAssignment = onlyElementOrUndefined(outputAssignments);
    assert(outputAssignment !== undefined);
    return outputAssignment;
  }

  executeTransform(
    columns: Map<string, TableColumn>,
    numberOfRows: number,
    context: ExecutionContext,
  ): TableColumn {
    context.enterNode(this.transform);

    const result = this.doExecuteTransform(columns, numberOfRows, context);
    context.exitNode(this.transform);

    return result;
  }

  private doExecuteTransform(
    columns: Map<string, TableColumn>,
    numberOfRows: number,
    context: ExecutionContext,
  ): TableColumn {
    const inputDetailsList = this.getInputDetails();
    const outputDetails = this.getOutputDetails();

    const newColumn: (
      | InternalValidValueRepresentation
      | InternalErrorValueRepresentation
    )[] = [];

    for (let rowIndex = 0; rowIndex < numberOfRows; ++rowIndex) {
      this.addVariablesToContext(inputDetailsList, columns, rowIndex, context);

      let newValue:
        | InternalValidValueRepresentation
        | InternalErrorValueRepresentation;
      try {
        newValue = evaluateExpression(
          this.getOutputAssignment().expression,
          context.evaluationContext,
          context.wrapperFactories,
        );
      } catch (e) {
        if (e instanceof Error) {
          newValue = new InvalidValue(e.message, e.stack);
        } else {
          newValue = new InvalidValue(String(e));
        }
      }

      if (
        !ERROR_TYPEGUARD(newValue) &&
        !isValidValueRepresentation(newValue, outputDetails.valueType, context)
      ) {
        assert(
          typeof newValue === 'string' ||
            typeof newValue === 'boolean' ||
            typeof newValue === 'number',
        );
        const message = `Invalid value in row ${
          rowIndex + 1
        }: "${newValue.toString()}" does not match the type ${outputDetails.valueType.getName()}`;
        context.logger.logDebug(message);
        newColumn.push(new InvalidValue(message));
      } else {
        newColumn.push(newValue);
      }

      this.removeVariablesFromContext(inputDetailsList, context);
    }

    return { values: newColumn, valueType: outputDetails.valueType };
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
    columns: Map<string, TableColumn<InternalValidValueRepresentation>>,
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
