import { strict as assert } from 'assert';

import * as R from '@jvalue/execution';
import {
  BlockExecutor,
  BlockExecutorClass,
  ColumnInformation,
  ExecutionContext,
  Sheet,
  Table,
  Valuetype,
  getValueType,
  implementsStatic,
} from '@jvalue/execution';
import {
  CellIndex,
  IOType,
  ValuetypeAssignment,
  getValuetypeName,
  rowIndexToString,
} from '@jvalue/language-server';

interface ColumnDefinitionEntry {
  sheetColumnIndex: number;
  columnName: string;
  valueType: Valuetype;
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
    const header = context.getBooleanAttributeValue('header');
    const columnDefinitions =
      context.getValuetypeAssignmentCollectionAttributeValue('columns');

    let columnEntries: ColumnDefinitionEntry[];

    if (header) {
      if (inputSheet.getNumberOfRows() < 1) {
        return R.err({
          message: 'The input sheet is empty and thus has no header',
          diagnostic: {
            node: context.getOrFailAttribute('header'),
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
            node: context.getOrFailAttribute('columns'),
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

    const tableData = this.constructAndValidateTableData(
      inputSheet,
      header,
      columnEntries,
      context,
    );

    context.logger.logDebug(
      `Validation completed, the resulting table has ${tableData.length} row(s) and ${columnEntries.length} column(s)`,
    );

    const columnInformation = columnEntries.map<ColumnInformation>(
      (columnEntry) => ({
        name: columnEntry.columnName,
        type: columnEntry.valueType,
      }),
    );
    const resultingTable = new Table(columnInformation, tableData);
    return R.ok(resultingTable);
  }

  private constructAndValidateTableData(
    sheet: Sheet,
    header: boolean,
    columnEntries: ColumnDefinitionEntry[],
    context: ExecutionContext,
  ): string[][] {
    const tableData: string[][] = [];
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
      } else {
        tableData.push(tableRow);
      }
    });
    return tableData;
  }

  private constructAndValidateTableRow(
    sheetRow: string[],
    sheetRowIndex: number,
    columnEntries: ColumnDefinitionEntry[],
    context: ExecutionContext,
  ): string[] | undefined {
    let invalidRow = false;
    const tableRow: string[] = [];
    columnEntries.forEach((columnEntry, tableColumnIndex) => {
      const sheetColumnIndex = columnEntry.sheetColumnIndex;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const value = sheetRow[sheetColumnIndex]!;
      if (!columnEntry.valueType.isValid(value, context)) {
        const cellIndex = new CellIndex(sheetColumnIndex, sheetRowIndex);
        context.logger.logDebug(
          `The value at cell ${cellIndex.toString()} does not match the type ${getValuetypeName(
            columnEntry.astNode.type,
          )}`,
        );
        invalidRow = true;
        return;
      }
      tableRow[tableColumnIndex] = value;
    });
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (invalidRow) {
      return undefined;
    }

    assert(tableRow.length === columnEntries.length);
    return tableRow;
  }

  private deriveColumnDefinitionEntriesWithoutHeader(
    columnDefinitions: ValuetypeAssignment[],
  ): ColumnDefinitionEntry[] {
    return columnDefinitions.map<ColumnDefinitionEntry>(
      (columnDefinition, columnDefinitionIndex) => ({
        sheetColumnIndex: columnDefinitionIndex,
        columnName: columnDefinition.name,
        valueType: getValueType(columnDefinition.type),
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
        valueType: getValueType(columnDefinition.type),
        astNode: columnDefinition,
      });
    }

    return columnEntries;
  }
}
