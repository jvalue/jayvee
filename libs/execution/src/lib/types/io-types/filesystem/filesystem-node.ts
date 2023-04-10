// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '@jvalue/jayvee-language-server';

import { IOTypeImplementation } from '../io-type-implementation';

export abstract class FileSystemNode
  implements IOTypeImplementation<IOType.FILE_SYSTEM_NODE>
{
  public readonly ioType = IOType.FILE_SYSTEM_NODE;

  constructor(public name: string) {}

  abstract getNodeSize(): number;
}
