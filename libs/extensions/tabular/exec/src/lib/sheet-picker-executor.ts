// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  Sheet,
  Workbook,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType, PrimitiveValuetypes } from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class SheetPickerExecutor extends AbstractBlockExecutor<
  IOType.WORKBOOK,
  IOType.SHEET
> {
  public static readonly type = 'SheetPicker';

  constructor() {
    super(IOType.WORKBOOK, IOType.SHEET);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async doExecute(
    workbook: Workbook,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet | null>> {
    const sheetName = context.getPropertyValue(
      'sheetName',
      PrimitiveValuetypes.Text,
    );
    const sheet = workbook.getSheetByName(sheetName);
    return R.ok(sheet);
  }
}
