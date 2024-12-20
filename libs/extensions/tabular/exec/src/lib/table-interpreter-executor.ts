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
  IOType,
  type InternalValueRepresentation,
  type ValueType,
  type ValuetypeAssignment,
  rowIndexToString,
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

      columnEntries =
        TableInterpreterExecutor.deriveColumnDefinitionEntriesFromHeader(
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

      columnEntries =
        TableInterpreterExecutor.deriveColumnDefinitionEntriesWithoutHeader(
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

    const resultingTable = TableInterpreterExecutor.constructAndValidateTable(
      inputSheet,
      header,
      columnEntries,
      context,
    );
    context.logger.logDebug(
      `Validation completed, the resulting table has ${resultingTable.getNumberOfRows()} row(s) and ${resultingTable.getNumberOfColumns()} column(s)`,
    );
    return R.ok(resultingTable);
  }

  private static constructAndValidateTable(
    sheet: Sheet,
    header: boolean,
    columnEntries: ColumnDefinitionEntry[],
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
        context,
      );
      if (tableRow === undefined) {
        context.logger.logDebug(
          `Omitting row ${rowIndexToString(sheetRowIndex)}`,
        );
        return;
      }
      table.addRow(tableRow);
    });
    return table;
  }

  private static constructAndValidateTableRow(
    sheetRow: string[],
    sheetRowIndex: number,
    columnEntries: ColumnDefinitionEntry[],
    context: ExecutionContext,
  ): R.TableRow | undefined {
    let invalidRow = false;
    const tableRow: R.TableRow = {};
    columnEntries.forEach((columnEntry) => {
      const sheetColumnIndex = columnEntry.sheetColumnIndex;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const value = sheetRow[sheetColumnIndex]!;
      const valueType = columnEntry.valueType;

      const parsedValue = this.parseAndValidateValue(value, valueType, context);
      if (parsedValue === undefined) {
        const currentCellIndex = new CellIndex(sheetColumnIndex, sheetRowIndex);
        context.logger.logDebug(
          `Invalid value at cell ${currentCellIndex.toString()}: "${value}" does not match the type ${columnEntry.valueType.getName()}`,
        );
        invalidRow = true;
        return;
      }

      tableRow[columnEntry.columnName] = parsedValue;
    });
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (invalidRow) {
      return undefined;
    }

    assert(Object.keys(tableRow).length === columnEntries.length);
    return tableRow;
  }

  static parseAndValidateValue(
    value: string,
    valueType: ValueType,
    context: ExecutionContext,
  ): InternalValueRepresentation | undefined {
    const parsedValue = parseValueToInternalRepresentation(value, valueType);
    if (parsedValue === undefined) {
      return undefined;
    }

    if (!isValidValueRepresentation(parsedValue, valueType, context)) {
      return undefined;
    }
    return parsedValue;
  }

  static deriveColumnDefinitionEntriesWithoutHeader(
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

  private static deriveColumnDefinitionEntriesFromHeader(
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
