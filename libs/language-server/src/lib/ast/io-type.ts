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
  WORKBOOK = 'Workbook',
}

export function getIOType(blockIO: BlocktypeInput | BlocktypeOutput): IOType {
  const ioTypeName = blockIO.iotype.ref?.name;
  assert(
    ioTypeName !== undefined,
    `Unknown IOType name for block input/output ${blockIO.name}.`,
  );

  assert(ioTypeName in IOType, `IOType ${ioTypeName} does not exist.`);

  return ioTypeName as IOType;
}
