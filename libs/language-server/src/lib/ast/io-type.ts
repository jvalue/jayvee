// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BlocktypeInput, BlocktypeOutput } from './generated/ast';

export enum IOType {
  NONE = 'None',
  FILE = 'File',
  TEXT_FILE = 'TextFile',
  FILE_SYSTEM = 'FileSystem',
  SHEET = 'Sheet',
  TABLE = 'Table',
}

export function getIOType(blockIO: BlocktypeInput | BlocktypeOutput): IOType {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return IOType[blockIO.iotype.ref?.name as keyof typeof IOType] ?? IOType.NONE;
}
