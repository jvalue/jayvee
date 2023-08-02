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
  Sheet,
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
    const workSheetsFromFile = xlsx.read(file.content, { dense: true });
    const wsName = workSheetsFromFile.SheetNames[0] ?? '';
    const ws = workSheetsFromFile.Sheets[wsName];
    assert(ws instanceof Sheet);

    const wsAA = Array.prototype.map.call<xlsx.WorkSheet, any[], string[][]>(
      ws,
      (x: xlsx.CellObject[]): string[] => {
        return x.map<string>((y: xlsx.CellObject) => {
          return y.v?.toString() ?? '';
        });
      },
    );
    const currentSheet = new Sheet(wsAA, wsName);
    const wb = new Workbook([currentSheet]);

    return Promise.resolve(R.ok(wb));
  }
}
