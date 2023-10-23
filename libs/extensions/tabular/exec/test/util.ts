// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import { Workbook } from '@jvalue/jayvee-execution';
import * as exceljs from 'exceljs';

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
