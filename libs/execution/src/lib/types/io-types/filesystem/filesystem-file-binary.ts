// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { IOTypeImplementation } from '../io-type-implementation';

import { FileSystemFile } from './filesystem-file';

export class BinaryFile
  extends FileSystemFile<ArrayBuffer>
  implements IOTypeImplementation<IOType.FILE_SYSTEM_NODE>
{
  public override readonly ioType = IOType.FILE_SYSTEM_NODE;

  override getNodeSize(): number {
    throw new Error('Method not implemented.');
  }
}
