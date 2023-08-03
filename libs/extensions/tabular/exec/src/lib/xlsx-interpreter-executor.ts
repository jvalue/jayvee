// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  BinaryFile,
  BlockExecutorClass,
  ExecutionContext,
  Workbook,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';
import * as xlsx from 'xlsx';

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
    context.logger.logDebug(`reading from xlsx file`);
    const workBookFromFile = xlsx.read(file.content, { dense: true });
    const workbook = new Workbook();
    for (const workSheetName of workBookFromFile.SheetNames) {
      const workSheet = workBookFromFile.Sheets[workSheetName];
      assert(workSheet !== undefined);

      const workSheetDataArray = Array.prototype.map.call<
        xlsx.WorkSheet,
        [
          callbackfn: (
            value: xlsx.CellObject[],
            index: number,
            array: xlsx.WorkSheet[],
          ) => string[],
        ],
        string[][]
      >(workSheet, (x: xlsx.CellObject[]): string[] => {
        return x.map<string>((y: xlsx.CellObject) => {
          return y.v?.toString() ?? '';
        });
      });
      workbook.addNewSheet(workSheetDataArray, workSheetName);
    }
    return Promise.resolve(R.ok(workbook));
  }
}
