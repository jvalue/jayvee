// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  IsValidVisitor,
  Sheet,
  StandardRepresentationResolver,
  Table,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import {
  CellIndex,
  IOType,
  Valuetype,
  ValuetypeAssignment,
  createValuetype,
  getValuetypeName,
  rowIndexToString,
} from '@jvalue/jayvee-language-server';

interface ColumnDefinitionEntry {
  sheetColumnIndex: number;
  columnName: string;
  valuetype: Valuetype;
  astNode: ValuetypeAssignment;
}

@implementsStatic<BlockExecutorClass>()
export class TableInterpreterExecutor
  implements BlockExecutor<IOType.SHEET, IOType.TABLE>
{
  public static readonly type = 'TableInterpreter';
  public readonly inputType = IOType.SHEET;
  public readonly outputType = IOType.TABLE;

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    inputSheet: Sheet,
    context: ExecutionContext,
  ): Promise<R.Result<Table>> {
    const header = context.getBooleanPropertyValue('header');
    const columnDefinitions =
      context.getValuetypeAssignmentCollectionPropertyValue('columns');

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

      columnEntries =
        this.deriveColumnDefinitionEntriesWithoutHeader(columnDefinitions);
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
    context: ExecutionContext,
  ): Table {
    const table = new Table();

    // add columns
    columnEntries.forEach((columnEntry) => {
      table.addColumn(columnEntry.columnName, {
        values: [],
        valuetype: columnEntry.valuetype,
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

  private constructAndValidateTableRow(
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
      if (
        !columnEntry.valuetype.acceptVisitor(new IsValidVisitor(value, context))
      ) {
        const cellIndex = new CellIndex(sheetColumnIndex, sheetRowIndex);
        context.logger.logDebug(
          `Invalid value at cell ${cellIndex.toString()}: "${value}" does not match the type ${getValuetypeName(
            columnEntry.astNode.type,
          )}`,
        );
        invalidRow = true;
        return;
      }
      tableRow[columnEntry.columnName] = new StandardRepresentationResolver(
        value,
      ).fromValuetype(columnEntry.valuetype);
    });
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (invalidRow) {
      return undefined;
    }

    assert(Object.keys(tableRow).length === columnEntries.length);
    return tableRow;
  }

  private deriveColumnDefinitionEntriesWithoutHeader(
    columnDefinitions: ValuetypeAssignment[],
  ): ColumnDefinitionEntry[] {
    return columnDefinitions.map<ColumnDefinitionEntry>(
      (columnDefinition, columnDefinitionIndex) => ({
        sheetColumnIndex: columnDefinitionIndex,
        columnName: columnDefinition.name,
        valuetype: createValuetype(columnDefinition.type),
        astNode: columnDefinition,
      }),
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
      columnEntries.push({
        sheetColumnIndex: indexOfMatchingHeader,
        columnName: columnDefinition.name,
        valuetype: createValuetype(columnDefinition.type),
        astNode: columnDefinition,
      });
    }

    return columnEntries;
  }
}
