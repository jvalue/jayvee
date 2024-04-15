// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type WrapperFactoryProvider,
  internalValueToString,
} from '@jvalue/jayvee-language-server';

import { type Logger } from '../logging/logger';
import { type Workbook } from '../types';
import { type FileSystem } from '../types/io-types/filesystem';
import { type BinaryFile } from '../types/io-types/filesystem-node-file-binary';
import { type TextFile } from '../types/io-types/filesystem-node-file-text';
import { type IoTypeVisitor } from '../types/io-types/io-type-implementation';
import { type Sheet } from '../types/io-types/sheet';
import { type Table } from '../types/io-types/table';

import { type DebugGranularity } from './debug-configuration';

export class DebugLogVisitor implements IoTypeVisitor<void> {
  private readonly PEEK_NUMBER_OF_WORKBOOKS = 5;
  private readonly PEEK_NUMBER_OF_ROWS = 10;
  private readonly PEEK_NUMBER_OF_BYTES = 100;
  private readonly PEEK_NUMBER_OF_LINES = 10;

  constructor(
    private debugGranularity: DebugGranularity,
    private logPrefix: string,
    private logger: Logger,
    private wrapperFactories: WrapperFactoryProvider,
  ) {}

  visitTable(table: Table): void {
    if (this.debugGranularity === 'minimal') {
      return;
    }

    const numberOfRows = table.getNumberOfRows();
    this.log(
      `Table with ${numberOfRows} rows and ${table.getNumberOfColumns()} columns.`,
    );

    const headers = [...table.getColumns().entries()]
      .map(([columnName, column]) => {
        return `${columnName} (${column.valueType.getName()})`;
      })
      .join(' | ');
    this.log(`[Header] ${headers}`);

    for (let i = 0; i < numberOfRows; ++i) {
      if (this.debugGranularity === 'peek' && i >= this.PEEK_NUMBER_OF_ROWS) {
        break;
      }

      const row = table.getRow(i);
      const rowData = [...row.values()]
        .map((cell) => internalValueToString(cell, this.wrapperFactories))
        .join(' | ');
      this.log(`[Row ${i}] ${rowData}`);
    }
    this.logPeekComment();
  }

  visitSheet(sheet: Sheet): void {
    if (this.debugGranularity === 'minimal') {
      return;
    }

    this.log(
      `Sheet with ${sheet.getNumberOfRows()} rows and ${sheet.getNumberOfColumns()} columns.`,
    );
    const rowsAsString = sheet
      .getData()
      .filter((_, rowIndex) => {
        if (this.debugGranularity === 'peek') {
          return rowIndex < this.PEEK_NUMBER_OF_ROWS;
        }
        return true;
      })
      .map((row) => `${row.map((cell) => `"${cell}"`).join(', ')}`);
    rowsAsString.forEach((row, i) => {
      this.log(`[Row ${i}] ${row}`);
    });

    this.logPeekComment();
  }

  visitNone(): void {
    if (this.debugGranularity === 'minimal') {
      return;
    }

    this.log('<None>');
  }

  visitFileSystem(fileSystem: FileSystem): void {
    if (this.debugGranularity === 'minimal') {
      return;
    }

    this.log(fileSystem.getFile('/')?.toString() ?? '<found no root file>');
  }

  visitBinaryFile(binaryFile: BinaryFile): void {
    if (this.debugGranularity === 'minimal') {
      return;
    }

    const buffer = binaryFile.content.slice(0, this.PEEK_NUMBER_OF_BYTES);
    const hexString = [...new Uint8Array(buffer)]
      .map((x) => x.toString(16).padStart(2, '0').toUpperCase())
      .join('');
    this.log(`<hex> ${hexString}`);
    this.logPeekComment();
  }

  visitTextFile(binaryFile: TextFile): void {
    if (this.debugGranularity === 'minimal') {
      return;
    }

    for (let i = 0; i < binaryFile.content.length; ++i) {
      if (i > this.PEEK_NUMBER_OF_LINES) {
        break;
      }
      this.log(`[Line ${i}] ${binaryFile.content[i] ?? '<undefined>'}`);
    }
    this.logPeekComment();
  }

  private logPeekComment(): void {
    if (this.debugGranularity === 'minimal') {
      return;
    }

    if (this.debugGranularity !== 'peek') {
      return;
    }

    this.log('... (omitted in peek mode)');
  }
  visitWorkbook(workbook: Workbook): void {
    if (this.debugGranularity === 'minimal') {
      return;
    }
    const workbookSheets = workbook.getSheets();
    const keys = Array.from(workbookSheets.keys());

    const numberOfSheets = workbookSheets.size;
    if (numberOfSheets === 0) {
      this.log(`Empty Workbook`);
      return;
    }
    this.log(`Workbook with ${numberOfSheets} Sheets.`);

    this.log(`Sheets in WorkBook:`);

    for (let i = 0; i < numberOfSheets; ++i) {
      if (
        this.debugGranularity === 'peek' &&
        i >= this.PEEK_NUMBER_OF_WORKBOOKS
      ) {
        break;
      }
      const currentWorkbookName = keys[i];
      if (currentWorkbookName === undefined) {
        continue;
      }
      this.log(`WorkSheet: ${currentWorkbookName}`);
    }
    this.logPeekComment();
  }

  private log(text: string): void {
    this.logger.logDebug(`[${this.logPrefix}] ${text}`);
  }
}
