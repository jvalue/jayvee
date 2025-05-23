// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { TextDecoder } from 'node:util';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BinaryFile,
  type BlockExecutorClass,
  type ExecutionContext,
  TextFile,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';

@implementsStatic<BlockExecutorClass>()
export class TextFileInterpreterExecutor extends AbstractBlockExecutor<
  IOType.FILE,
  IOType.TEXT_FILE
> {
  public static readonly type = 'TextFileInterpreter';

  constructor() {
    super(IOType.FILE, IOType.TEXT_FILE);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async doExecute(
    file: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<TextFile>> {
    const encoding = context.getPropertyValue(
      'encoding',
      context.valueTypeProvider.Primitives.Text,
    );

    const decoder = new TextDecoder(encoding);
    context.logger.logDebug(
      `Decoding file content using encoding "${encoding}"`,
    );
    const textContent = decoder.decode(file.content);

    return R.ok(
      new TextFile(file.name, file.extension, file.mimeType, textContent),
    );
  }
}
