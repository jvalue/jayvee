// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { File } from './file';
import { IOTypeImplementation } from './io-type-implementation';

export class TextFile
  extends File<string[]>
  implements IOTypeImplementation<IOType.TEXT_FILE>
{
  public readonly ioType = IOType.TEXT_FILE;
}
