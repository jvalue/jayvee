// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  type Sheet,
  type Workbook,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';

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
  ): Promise<R.Result<Sheet>> {
    const sheetName = context.getPropertyValue(
      'sheetName',
      context.valueTypeProvider.Primitives.Text,
    );
    const sheet = workbook.getSheetByName(sheetName);
    if (sheet === undefined) {
      return R.err({
        message: `Workbook does not contain a sheet named ${sheetName}`,
        diagnostic: { node: context.getCurrentNode(), property: 'name' },
      });
    }
    return R.ok(sheet);
  }
}
