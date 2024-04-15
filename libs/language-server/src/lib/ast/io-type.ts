// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { type BlockTypeInput, type BlockTypeOutput } from './generated/ast';

export enum IOType {
  NONE = 'None',
  FILE = 'File',
  TEXT_FILE = 'TextFile',
  FILE_SYSTEM = 'FileSystem',
  SHEET = 'Sheet',
  TABLE = 'Table',
  WORKBOOK = 'Workbook',
}

export function getIOType(blockIO: BlockTypeInput | BlockTypeOutput): IOType {
  const ioTypeName = blockIO.iotype.ref?.name;
  assert(
    ioTypeName !== undefined,
    `Unknown IOType name for block input/output ${blockIO.name}.`,
  );

  assert(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    Object.values(IOType).some((type) => type === ioTypeName),
    `IO type ${ioTypeName} does not exist.`,
  );
  return ioTypeName as IOType;
}
