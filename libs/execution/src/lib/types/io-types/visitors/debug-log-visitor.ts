// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { internalValueToString } from '@jvalue/jayvee-language-server';

import { Logger } from '../../../logger';
import { FileSystem } from '../filesystem';
import { BinaryFile } from '../filesystem-node-file-binary';
import { TextFile } from '../filesystem-node-file-text';
import { IoTypeVisitor } from '../io-type-implementation';
import { Sheet } from '../sheet';
import { Table } from '../table';

export const DebugGranularityValues = ['peek', 'exhaustive', 'skip'] as const; // convention: last item is the default value
export type DebugGranularity = (typeof DebugGranularityValues)[number];
export function isDebugGranularity(obj: unknown): obj is DebugGranularity {
  return obj === 'exhaustive' || obj === 'peek' || obj === 'skip';
}

export class DebugLogVisitor implements IoTypeVisitor<void> {
  private readonly PEEK_NUMBER_OF_ROWS = 10;
  private readonly PEEK_NUMBER_OF_BYTES = 100;
  private readonly PEEK_NUMBER_OF_LINES = 10;

  constructor(
    private debugGranularity: DebugGranularity,
    private logPrefix: string,
    private logger: Logger,
  ) {}

  visitTable(table: Table): void {
    if (this.debugGranularity === 'skip') {
      return;
    }

    const numberOfRows = table.getNumberOfRows();
    this.log(
      `Table with ${numberOfRows} rows and ${table.getNumberOfColumns()} columns.`,
    );

    const headers = [...table.getColumns().entries()]
      .map(([columnName, column]) => {
        return `${columnName} (${column.valuetype.getName()})`;
      })
      .join(' | ');
    this.log(`[Header] ${headers}`);

    for (let i = 0; i < numberOfRows; ++i) {
      if (this.debugGranularity === 'peek' && i >= this.PEEK_NUMBER_OF_ROWS) {
        break;
      }

      const row = table.getRow(i);
      const rowData = [...row.values()]
        .map((cell) => internalValueToString(cell))
        .join(' | ');
      this.log(`[Row ${i}] ${rowData}`);
    }
    this.logPeekComment();
  }

  visitSheet(sheet: Sheet): void {
    if (this.debugGranularity === 'skip') {
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
    if (this.debugGranularity === 'skip') {
      return;
    }

    this.log('<None>');
  }

  visitFileSystem(fileSystem: FileSystem): void {
    if (this.debugGranularity === 'skip') {
      return;
    }

    this.log(fileSystem.getFile('/')?.toString() ?? '<found no root file>');
  }

  visitBinaryFile(binaryFile: BinaryFile): void {
    if (this.debugGranularity === 'skip') {
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
    if (this.debugGranularity === 'skip') {
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
    if (this.debugGranularity === 'skip') {
      return;
    }

    if (this.debugGranularity !== 'peek') {
      return;
    }

    this.log('... (omitted in peek mode)');
  }

  private log(text: string): void {
    this.logger.logDebug(`[${this.logPrefix}] ${text}`);
  }
}
