// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { FileSystemFile } from './filesystem-node-file';
import {
  type IOTypeImplementation,
  type IoTypeVisitor,
} from './io-type-implementation';

export class TextFile
  extends FileSystemFile<string[]>
  implements IOTypeImplementation<IOType.TEXT_FILE>
{
  public readonly ioType = IOType.TEXT_FILE;

  acceptVisitor<R>(visitor: IoTypeVisitor<R>): R {
    return visitor.visitTextFile(this);
  }
}
