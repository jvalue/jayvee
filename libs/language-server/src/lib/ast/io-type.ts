// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

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
  const ioName = blockIO.iotype.ref?.name as string;

  assert(
    Object.values(IOType).some((type) => type === ioName),
    `IOType ${ioName} does not exist.`,
  );

  return ioName as IOType;
}
