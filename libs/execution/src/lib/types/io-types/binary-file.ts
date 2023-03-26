// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/language-server';

import { File } from './file';
import { IOTypeImplementation } from './io-type-implementation';

export class BinaryFile
  extends File<ArrayBuffer>
  implements IOTypeImplementation<IOType.FILE>
{
  public readonly ioType = IOType.FILE;
}
