// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { FileSystemFile } from './filesystem-node-file';
import { IOTypeImplementation } from './io-type-implementation';

export class TextFile
  extends FileSystemFile<string[]>
  implements IOTypeImplementation<IOType.TEXT_FILE>
{
  public readonly ioType = IOType.TEXT_FILE;

  override getNodeSize(): number {
    return this.content.length;
  }
}
