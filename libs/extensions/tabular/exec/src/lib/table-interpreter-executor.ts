// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  type Sheet,
  Table,
  implementsStatic,
  isValidValueRepresentation,
  parseValueToInternalRepresentation,
} from '@jvalue/jayvee-execution';
import {
  CellIndex,
  ERROR_TYPEGUARD,
  IOType,
  InternalErrorRepresentation,
  type InternalValueRepresentation,
  InvalidError,
  MissingError,
  type ValueType,
  type ValuetypeAssignment,
  internalValueToString,
} from '@jvalue/jayvee-language-server';

export interface ColumnDefinitionEntry {
  sheetColumnIndex: number;
  columnName: string;
  valueType: ValueType;
  astNode: ValuetypeAssignment;
}

@implementsStatic<BlockExecutorClass>()
export class TableInterpreterExecutor extends AbstractBlockExecutor<
  IOType.SHEET,
  IOType.TABLE
> {
  public static readonly type = 'TableInterpreter';

  constructor() {
    super(IOType.SHEET, IOType.TABLE);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async doExecute(
    inputSheet: Sheet,
    context: ExecutionContext,
  ): Promise<R.Result<Table>> {
    const header = context.getPropertyValue(
      'header',
      context.valueTypeProvider.Primitives.Boolean,
    );
    const columnDefinitions = context.getPropertyValue(
      'columns',
      context.valueTypeProvider.createCollectionValueTypeOf(
        context.valueTypeProvider.Primitives.ValuetypeAssignment,
      ),
    );
    const skipLeadingWhitespace = context.getPropertyValue(
      'skipLeadingWhitespace',
      context.valueTypeProvider.Primitives.Boolean,
    );
    const skipTrailingWhitespace = context.getPropertyValue(
      'skipTrailingWhitespace',
      context.valueTypeProvider.Primitives.Boolean,
    );

    let columnEntries: ColumnDefinitionEntry[];

    if (header) {
      if (inputSheet.getNumberOfRows() < 1) {
        return R.err({
          message: 'The input sheet is empty and thus has no header',
          diagnostic: {
            node: context.getOrFailProperty('header'),
          },
        });
      }

      const headerRow = inputSheet.getHeaderRow();

      columnEntries = this.deriveColumnDefinitionEntriesFromHeader(
        columnDefinitions,
        headerRow,
        context,
      );
    } else {
      if (inputSheet.getNumberOfColumns() < columnDefinitions.length) {
        return R.err({
          message: `There are ${
            columnDefinitions.length
          } column definitions but the input sheet only has ${inputSheet.getNumberOfColumns()} columns`,
          diagnostic: {
            node: context.getOrFailProperty('columns'),
          },
        });
      }

      columnEntries = this.deriveColumnDefinitionEntriesWithoutHeader(
        columnDefinitions,
        context,
      );
    }

    const numberOfTableRows = header
      ? inputSheet.getNumberOfRows() - 1
      : inputSheet.getNumberOfRows();
    context.logger.logDebug(
      `Validating ${numberOfTableRows} row(s) according to the column types`,
    );

    const resultingTable = this.constructAndValidateTable(
      inputSheet,
      header,
      columnEntries,
      skipLeadingWhitespace,
      skipTrailingWhitespace,
      context,
    );
    context.logger.logDebug(
      `Validation completed, the resulting table has ${resultingTable.getNumberOfRows()} row(s) and ${resultingTable.getNumberOfColumns()} column(s)`,
    );
    return R.ok(resultingTable);
  }

  private constructAndValidateTable(
    sheet: Sheet,
    header: boolean,
    columnEntries: ColumnDefinitionEntry[],
    skipLeadingWhitespace: boolean,
    skipTrailingWhitespace: boolean,
    context: ExecutionContext,
  ): Table {
    const table = new Table();

    // add columns
    columnEntries.forEach((columnEntry) => {
      table.addColumn(columnEntry.columnName, {
        values: [],
        valueType: columnEntry.valueType,
      });
    });

    // add rows
    sheet.iterateRows((sheetRow, sheetRowIndex) => {
      if (header && sheetRowIndex === 0) {
        return;
      }

      const tableRow = this.constructAndValidateTableRow(
        sheetRow,
        sheetRowIndex,
        columnEntries,
        skipLeadingWhitespace,
        skipTrailingWhitespace,
        context,
      );
      table.addRow(tableRow);
    });
    return table;
  }

  private constructAndValidateTableRow(
    sheetRow: string[],
    sheetRowIndex: number,
    columnEntries: ColumnDefinitionEntry[],
    skipLeadingWhitespace: boolean,
    skipTrailingWhitespace: boolean,
    context: ExecutionContext,
  ): R.TableRow {
    const tableRow: R.TableRow = {};
    columnEntries.forEach((columnEntry) => {
      const valueType = columnEntry.valueType;
      const sheetColumnIndex = columnEntry.sheetColumnIndex;
      const value = sheetRow[sheetColumnIndex];

      const parsedValue =
        value !== undefined
          ? this.parseAndValidateValue(
              value,
              valueType,
              skipLeadingWhitespace,
              skipTrailingWhitespace,
              context,
            )
          : new MissingError(
              `The sheet row did not contain a value at index ${sheetColumnIndex}`,
            );
      if (ERROR_TYPEGUARD(parsedValue)) {
        const currentCellIndex = new CellIndex(sheetColumnIndex, sheetRowIndex);
        context.logger.logDebug(
          `Invalid value at cell ${currentCellIndex.toString()}: "${value}" does not match the type ${columnEntry.valueType.getName()}`,
        );
      }

      tableRow[columnEntry.columnName] = parsedValue;
    });

    assert(Object.keys(tableRow).length === columnEntries.length);
    return tableRow;
  }

  private parseAndValidateValue(
    value: string,
    valueType: ValueType,
    skipLeadingWhitespace: boolean,
    skipTrailingWhitespace: boolean,
    context: ExecutionContext,
  ): InternalValueRepresentation | InternalErrorRepresentation {
    const parsedValue = parseValueToInternalRepresentation(value, valueType, {
      skipLeadingWhitespace,
      skipTrailingWhitespace,
    });

    if (
      !ERROR_TYPEGUARD(parsedValue) &&
      !isValidValueRepresentation(parsedValue, valueType, context)
    ) {
      return new InvalidError(
        `The following value was not valid for valuetype ${valueType.getName()}: ${internalValueToString(
          parsedValue,
          context.wrapperFactories,
        )}`,
      );
    }
    return parsedValue;
  }

  private deriveColumnDefinitionEntriesWithoutHeader(
    columnDefinitions: ValuetypeAssignment[],
    context: ExecutionContext,
  ): ColumnDefinitionEntry[] {
    return columnDefinitions.map<ColumnDefinitionEntry>(
      (columnDefinition, columnDefinitionIndex) => {
        const columnValuetype = context.wrapperFactories.ValueType.wrap(
          columnDefinition.type,
        );
        assert(columnValuetype !== undefined);
        return {
          sheetColumnIndex: columnDefinitionIndex,
          columnName: columnDefinition.name,
          valueType: columnValuetype,
          astNode: columnDefinition,
        };
      },
    );
  }

  private deriveColumnDefinitionEntriesFromHeader(
    columnDefinitions: ValuetypeAssignment[],
    headerRow: string[],
    context: ExecutionContext,
  ): ColumnDefinitionEntry[] {
    context.logger.logDebug(`Matching header with provided column names`);

    const columnEntries: ColumnDefinitionEntry[] = [];
    for (const columnDefinition of columnDefinitions) {
      const indexOfMatchingHeader = headerRow.findIndex(
        (headerColumnName) => headerColumnName === columnDefinition.name,
      );
      if (indexOfMatchingHeader === -1) {
        context.logger.logDebug(
          `Omitting column "${columnDefinition.name}" as the name was not found in the header`,
        );
        continue;
      }
      const columnValuetype = context.wrapperFactories.ValueType.wrap(
        columnDefinition.type,
      );
      assert(columnValuetype !== undefined);

      columnEntries.push({
        sheetColumnIndex: indexOfMatchingHeader,
        columnName: columnDefinition.name,
        valueType: columnValuetype,
        astNode: columnDefinition,
      });
    }

    return columnEntries;
  }
}
