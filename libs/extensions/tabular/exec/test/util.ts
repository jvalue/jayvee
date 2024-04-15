// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import {
  Table,
  type TableRow,
  Workbook,
  parseValueToInternalRepresentation,
} from '@jvalue/jayvee-execution';
import {
  type InternalValueRepresentation,
  type ValueType,
} from '@jvalue/jayvee-language-server';
import * as exceljs from 'exceljs';

import { type ColumnDefinitionEntry } from '../src/lib/table-interpreter-executor';

export async function createWorkbookFromLocalExcelFile(
  fileName: string,
): Promise<Workbook> {
  const workBookFromFile = new exceljs.Workbook();
  await workBookFromFile.xlsx.readFile(path.resolve(__dirname, fileName));

  const workbook = new Workbook();

  workBookFromFile.eachSheet((workSheet) => {
    const workSheetDataArray: string[][] = [];
    workSheet.eachRow((row, rowNumber) => {
      const cellValues: string[] = [];

      // ExcelJS Rows and Columns are indexed from 1
      // We reduce their index to match Sheets being zero indexed
      row.eachCell(
        { includeEmpty: true },
        (cell: exceljs.Cell, colNumber: number) => {
          cellValues[colNumber - 1] = cell.text;
        },
      );

      workSheetDataArray[rowNumber - 1] = cellValues;
    });

    workbook.addSheet(workSheetDataArray, workSheet.name);
  });

  return workbook;
}

export type ReducedColumnDefinitionEntry = Pick<
  ColumnDefinitionEntry,
  'sheetColumnIndex' | 'columnName' | 'valueType'
>;

/**
 * Creates a Table from the first sheet of the excel file pointed to by {@link fileName}
 * and parsed using the given column definitions.
 * Note: The parsing is static and thus cannot detect runtime types!
 * @param fileName
 * @param columnDefinitions columns to be read from table (no header matching)
 * @returns Table containing data of excel
 */
export async function createTableFromLocalExcelFile(
  fileName: string,
  columnDefinitions: ReducedColumnDefinitionEntry[],
): Promise<Table> {
  const workBookFromFile = new exceljs.Workbook();
  await workBookFromFile.xlsx.readFile(path.resolve(__dirname, fileName));

  const workSheet = workBookFromFile.worksheets[0] as exceljs.Worksheet;
  const table = new Table();

  columnDefinitions.forEach((columnDefinition) => {
    table.addColumn(columnDefinition.columnName, {
      values: [],
      valueType: columnDefinition.valueType,
    });
  });

  workSheet.eachRow((row) => {
    const tableRow = constructTableRow(row, columnDefinitions);
    table.addRow(tableRow);
  });

  return table;
}
function constructTableRow(
  row: exceljs.Row,
  columnDefinitions: ReducedColumnDefinitionEntry[],
): TableRow {
  const tableRow: TableRow = {};

  row.eachCell(
    { includeEmpty: true },
    (cell: exceljs.Cell, colNumber: number) => {
      if (colNumber > columnDefinitions.length) return;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const columnDefinition = columnDefinitions[colNumber - 1]!;
      const value = cell.text;
      const valueType = columnDefinition.valueType;

      const parsedValue = parseAndValidatePrimitiveValue(value, valueType);
      if (parsedValue === undefined) {
        return;
      }

      tableRow[columnDefinition.columnName] = parsedValue;
    },
  );
  return tableRow;
}
function parseAndValidatePrimitiveValue(
  value: string,
  valueType: ValueType,
): InternalValueRepresentation | undefined {
  const parsedValue = parseValueToInternalRepresentation(value, valueType);
  if (parsedValue === undefined) {
    return undefined;
  }

  return parsedValue;
}
