import { strict as assert } from 'assert';

import * as R from '@jayvee/execution';
import {
  AbstractValueType,
  BlockExecutor,
  Sheet,
  Table,
  getValueType,
} from '@jayvee/execution';
import {
  CellIndex,
  IOType,
  TypeAssignment,
  rowIndexToString,
} from '@jayvee/language-server';

interface ColumnDefinitionEntry {
  sheetColumnIndex: number;
  columnName: string;
  valueType: AbstractValueType;
  astNode: TypeAssignment;
}

export class TableInterpreterExecutor extends BlockExecutor<
  IOType.SHEET,
  IOType.TABLE
> {
  constructor() {
    super('TableInterpreter', IOType.SHEET, IOType.TABLE);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async execute(inputSheet: Sheet): Promise<R.Result<Table>> {
    const header = this.getBooleanAttributeValue('header');
    const columnDefinitions =
      this.getTypeAssignmentCollectionAttributeValue('columns');

    let columnEntries: ColumnDefinitionEntry[];

    if (header) {
      if (inputSheet.height < 1) {
        return R.err({
          message: 'The input sheet is empty and thus has no header',
          diagnostic: {
            node: this.getOrFailAttribute('header'),
          },
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const headerRow = inputSheet.data[0]!;

      columnEntries = this.deriveColumnDefinitionEntriesFromHeader(
        columnDefinitions,
        headerRow,
      );
    } else {
      if (inputSheet.width < columnDefinitions.length) {
        return R.err({
          message: `There are ${columnDefinitions.length} column definitions but the input sheet only has ${inputSheet.width} columns`,
          diagnostic: {
            node: this.getOrFailAttribute('columns'),
          },
        });
      }

      columnEntries =
        this.deriveColumnDefinitionEntriesWithoutHeader(columnDefinitions);
    }

    const numberOfTableRows = header
      ? inputSheet.height - 1
      : inputSheet.height;
    this.logger.logDebug(
      `Validating ${numberOfTableRows} row(s) according to the column types`,
    );

    const tableData = this.constructAndValidateTableData(
      inputSheet,
      header,
      columnEntries,
    );

    this.logger.logDebug(
      `Validation completed, the resulting table has ${tableData.length} row(s) and ${columnEntries.length} column(s)`,
    );

    const resultingTable: Table = {
      ioType: IOType.TABLE,
      columnInformation: columnEntries.map((columnEntry) => ({
        name: columnEntry.columnName,
        type: columnEntry.valueType,
      })),
      data: tableData,
    };

    return R.ok(resultingTable);
  }

  private constructAndValidateTableData(
    sheet: Sheet,
    header: boolean,
    columnEntries: ColumnDefinitionEntry[],
  ): string[][] {
    const tableData: string[][] = [];
    sheet.data.forEach((sheetRow, sheetRowIndex) => {
      if (header && sheetRowIndex === 0) {
        return;
      }

      const tableRow = this.constructAndValidateTableRow(
        sheetRow,
        sheetRowIndex,
        columnEntries,
      );
      if (tableRow === undefined) {
        this.logger.logDebug(`Omitting row ${rowIndexToString(sheetRowIndex)}`);
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
  ): string[] | undefined {
    let invalidRow = false;
    const tableRow: string[] = [];
    columnEntries.forEach((columnEntry, tableColumnIndex) => {
      const sheetColumnIndex = columnEntry.sheetColumnIndex;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const value = sheetRow[sheetColumnIndex]!;
      if (!columnEntry.valueType.isValid(value)) {
        const cellIndex = new CellIndex(sheetColumnIndex, sheetRowIndex);
        this.logger.logDebug(
          `The value at cell ${cellIndex.toString()} does not match the type ${
            columnEntry.astNode.type
          }`,
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
    columnDefinitions: TypeAssignment[],
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
    columnDefinitions: TypeAssignment[],
    headerRow: string[],
  ): ColumnDefinitionEntry[] {
    this.logger.logDebug(`Matching header with provided column names`);

    const columnEntries: ColumnDefinitionEntry[] = [];
    for (const columnDefinition of columnDefinitions) {
      const indexOfMatchingHeader = headerRow.findIndex(
        (headerColumnName) => headerColumnName === columnDefinition.name,
      );
      if (indexOfMatchingHeader === -1) {
        this.logger.logDebug(
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
