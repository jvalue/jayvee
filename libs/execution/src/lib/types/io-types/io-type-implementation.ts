// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type IOType } from '@jvalue/jayvee-language-server';

import { type BinaryFile } from './filesystem-node-file-binary.js';
import { type TextFile } from './filesystem-node-file-text.js';
import { type FileSystem } from './filesystem.js';
import { type None } from './none.js';
import { type Sheet } from './sheet.js';
import { type Table } from './table.js';
import { type Workbook } from './workbook.js';

export interface IOTypeImplementation<T extends IOType = IOType> {
  ioType: T;

  acceptVisitor<R = unknown>(visitor: IoTypeVisitor<R>): R;
}

export interface IoTypeVisitor<R = unknown> {
  visitTable(table: Table): R;
  visitSheet(sheet: Sheet): R;
  visitWorkbook(workbook: Workbook): R;
  visitNone(none: None): R;
  visitFileSystem(fileSystem: FileSystem): R;
  visitBinaryFile(binaryFile: BinaryFile): R;
  visitTextFile(binaryFile: TextFile): R;
}
