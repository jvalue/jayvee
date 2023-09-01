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
    context.logger.logDebug(`Reading from XLSX file`);
    const workBookFromFile = xlsx.read(file.content, {
      dense: true,
      raw: true,
    });
    const workbook = new Workbook();
    for (const workSheetName of workBookFromFile.SheetNames) {
      const workSheet = workBookFromFile.Sheets[workSheetName];
      assert(
        workSheet !== undefined,
        `Failed to read sheet ${workSheetName} from Workbook.`,
      );

      /** Extract sheet into array of array structure as described in https://github.com/SheetJS/sheetjs/issues/1258#issuecomment-419129919 */
      const workSheetDataArray: string[][] = xlsx.utils.sheet_to_json(
        workSheet,
        { header: 1, raw: true, rawNumbers: false, defval: '' },
      );

      workbook.addSheet(workSheetDataArray, workSheetName);
    }
    return Promise.resolve(R.ok(workbook));
  }
}
