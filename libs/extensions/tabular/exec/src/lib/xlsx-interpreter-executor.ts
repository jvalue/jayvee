// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BinaryFile,
  type BlockExecutorClass,
  type ExecutionContext,
  Workbook,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';
import * as exceljs from 'exceljs';

@implementsStatic<BlockExecutorClass>()
export class XLSXInterpreterExecutor extends AbstractBlockExecutor<
  IOType.FILE,
  IOType.WORKBOOK
> {
  public static readonly type = 'XLSXInterpreter';

  constructor() {
    super(IOType.FILE, IOType.WORKBOOK);
  }

  async doExecute(
    file: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<Workbook>> {
    context.logger.logDebug(`Reading from XLSX file`);
    const workBookFromFile = new exceljs.Workbook();
    await workBookFromFile.xlsx.load(file.content);

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

    return Promise.resolve(R.ok(workbook));
  }
}
